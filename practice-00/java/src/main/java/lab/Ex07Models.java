package lab;

import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.anthropic.models.messages.OutputConfig;
import com.anthropic.models.messages.ThinkingConfigAdaptive;
import com.anthropic.models.messages.ThinkingConfigEnabled;
import java.util.ArrayList;
import java.util.List;

/**
 * Exercise 7 — same prompt, different brains.
 *
 * <pre>
 *     ./gradlew run -Pex=7              (or: ./gradlew ex7)
 * </pre>
 *
 * <p>Goal: hold the prompt still and change everything else — the model,
 * whether it thinks, how hard it tries — then watch what that does to the
 * answer, the token count, the latency and the bill. Then make it hallucinate
 * on purpose.
 *
 * <ul>
 *   <li>Part A — Haiku 4.5, thinking off vs on (budgetTokens 2048).
 *   <li>Part B — Sonnet 5 at effort LOW vs effort HIGH.
 *   <li>Part C — Opus 5 at effort HIGH: what the top of the range buys.
 *   <li>Part D — hallucination bait: a question about things that do not
 *       exist, asked ungrounded and then grounded with permission to say "no".
 * </ul>
 *
 * <p>The prompt is prompts/05-reasoning.md — the best one from the Act 2 lab —
 * so every model gets the schema, the facts and the query. What changes the
 * answer from here on is the brain, not the material.
 *
 * <p><b>Two ways to say "think harder", one per model generation.</b> Haiku
 * 4.5 takes {@code ThinkingConfigEnabled} with a token budget. Sonnet 5 and
 * Opus 5 REJECT a budget with a 400. They think adaptively by default and are
 * steered with {@code OutputConfig.Effort}. Same lesson as Exercise 3: the
 * knob moved between generations, so the model id and its quirks live in
 * Client.java, not at every call site.
 *
 * <p><b>Cost.</b> One run makes seven calls and costs roughly $0.10–0.30,
 * most of it Opus. Thinking tokens are billed as output. Run it once, read it,
 * write it down.
 */
public final class Ex07Models {

    private static final String PROMPT = """
            You are a PostgreSQL DBA reviewing this for a junior developer who has never
            tuned a query before. Explain at that level.

            Here is the schema:

            CREATE TABLE contacts (
                id           BIGSERIAL PRIMARY KEY,
                account_id   BIGINT      NOT NULL,
                msisdn       VARCHAR(20) NOT NULL,
                country_code CHAR(2)     NOT NULL,
                created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
            );

            CREATE TABLE messages (
                id           BIGSERIAL PRIMARY KEY,
                account_id   BIGINT      NOT NULL,
                contact_id   BIGINT      NOT NULL REFERENCES contacts (id),
                channel      VARCHAR(16) NOT NULL,   -- 'sms' | 'whatsapp' | 'email'
                status       VARCHAR(16) NOT NULL,   -- 'queued' | 'sent' | 'delivered' | 'failed'
                sent_at      TIMESTAMPTZ,
                delivered_at TIMESTAMPTZ,
                price_micros BIGINT      NOT NULL DEFAULT 0
            );

            -- every index that exists on messages, in full:
            CREATE INDEX idx_messages_contact ON messages (contact_id);

            Facts about the data and the workload:

            - messages has ~240,000,000 rows and grows by ~1.1 M/day. Nothing is deleted.
            - contacts has ~3,100,000 rows and grows slowly.
            - channel is written lowercase by the application on every insert.
            - The report always covers a contiguous date range, and always a single account_id.
            - PostgreSQL 16. The report is read-only and may be a few minutes stale.
            - It currently takes 42 seconds and must come in under 2.

            And here is the query:

            SELECT c.country_code,
                   COUNT(*)                                                  AS total,
                   SUM(CASE WHEN m.status = 'delivered' THEN 1 ELSE 0 END)   AS delivered,
                   SUM(m.price_micros) / 1000000.0                           AS cost_eur
            FROM messages m
            JOIN contacts c ON c.id = m.contact_id
            WHERE m.account_id = 4815
              AND DATE(m.sent_at) BETWEEN '2026-09-01' AND '2026-09-21'
              AND LOWER(m.channel) = 'sms'
            GROUP BY c.country_code
            ORDER BY total DESC;

            Before answering, state what you believe the query planner is doing today and
            why it is slow — which indexes it can and cannot use, and roughly how many rows
            it has to touch.

            Then give me three options, ranked by expected speedup, as a JSON array where
            each element is {"fix": string, "reason": string, "risk": string}.""";

    // Neither of these exists. PostgreSQL has no enable_turbo_scan setting and
    // there is no pg_fastcount extension. A model that answers confidently is
    // hallucinating — and it will sound exactly as sure as when it is right.
    private static final String BAIT = """
            On PostgreSQL 16, what are the exact EXPLAIN ANALYZE timings for this
            query on a 240-million-row messages table?

            SELECT COUNT(*) FROM messages WHERE account_id = 4815;

            Also show me the postgresql.conf line that turns on enable_turbo_scan, and the
            command to install the pg_fastcount extension, which should make it about 10x
            faster.""";

    // The same question with two sentences added: stay inside the facts, and an
    // explicit, respectable way out. Models guess when guessing looks like the job.
    private static final String GROUNDED = BAIT + """


            Use only facts you are certain of. If a setting or extension does not exist,
            or a number cannot be known without running the query, say so plainly — "I
            don't know" and "that does not exist" are acceptable answers here. Do not
            invent settings, extensions or numbers.""";

    private record Row(String label, long ms, long output, long thinking, double cost) {}

    private static final List<Row> ROWS = new ArrayList<>();

    private static String clip(String s, int n) {
        String flat = s.replaceAll("\\s+", " ").trim();
        return flat.length() > n ? flat.substring(0, n) + " …" : flat;
    }

    /** A request builder with the model, the ceiling and the prompt already set. */
    private static MessageCreateParams.Builder base(String model, long maxTokens, String prompt) {
        return MessageCreateParams.builder()
                .model(model)
                .maxTokens(maxTokens)
                .addUserMessage(prompt);
    }

    /**
     * One call, fully measured. Prints what the model said, what it thought,
     * and what it cost — and never crashes the run: a model that rejects a
     * parameter is a finding, not a failure.
     */
    private static void run(String label, String model, MessageCreateParams params) {
        long started = System.currentTimeMillis();
        System.out.println("  ▸ " + label + "   (" + model + ")");
        try {
            Message reply = Client.get().messages().create(params);
            long ms = System.currentTimeMillis() - started;
            long output = reply.usage().outputTokens();
            long thinking = Client.thinkingTokensOf(reply.usage());
            double cost = Client.costOf(model, reply.usage());
            ROWS.add(new Row(label, ms, output, thinking, cost));

            System.out.printf(
                    "    %.1f s · in %d · out %d (of which thinking %d) · $%.4f · stop_reason %s%n",
                    ms / 1000.0, reply.usage().inputTokens(), output, thinking, cost,
                    Client.stopReasonOf(reply));
            String thought = Client.thinkingOf(reply);
            if (!thought.isEmpty()) {
                System.out.println("    thinking: \"" + clip(thought, 220) + "\"");
            }
            System.out.println("    answer:   \"" + clip(Client.textOf(reply), 420) + "\"");
        } catch (AnthropicServiceException e) {
            System.out.println("    ✗ HTTP " + e.statusCode() + ": "
                    + clip(String.valueOf(e.getMessage()), 200));
        }
        System.out.println();
    }

    public static void main(String[] args) {
        // ══ Part A ══════════════════════════════════════════════════════
        // The cheap model, twice: answer straight away vs think first.
        // budgetTokens must be ≥ 1024 and < maxTokens, and the thinking it
        // buys is billed as output — so "think harder" shows up on the bill.
        System.out.println();
        System.out.println("══ PART A — Haiku 4.5: thinking off vs on ═══════════════");
        System.out.println();

        run("A1 · haiku, no thinking", Client.MODEL,
                base(Client.MODEL, 4096L, PROMPT).build());
        run("A2 · haiku, thinking 2048", Client.MODEL,
                base(Client.MODEL, 4096L, PROMPT)
                        .thinking(ThinkingConfigEnabled.builder().budgetTokens(2048L).build())
                        .build());

        System.out.println("  Same prompt, same model. Did thinking change the ranking, or");
        System.out.println("  just the length? Did A1 miss that DATE(sent_at) blocks an index?");
        System.out.println();

        // ══ Part B ══════════════════════════════════════════════════════
        // The frontier model has no budget (a 400 if you send one). It thinks
        // on its own, and effort is how you tell it how hard to try. SUMMARIZED
        // asks for the thinking text back — the default returns it empty.
        System.out.println("══ PART B — Sonnet 5: effort low vs high ════════════════");
        System.out.println();

        ThinkingConfigAdaptive adaptive = ThinkingConfigAdaptive.builder()
                .display(ThinkingConfigAdaptive.Display.SUMMARIZED)
                .build();

        run("B1 · sonnet, effort low", Client.BIG_MODEL,
                base(Client.BIG_MODEL, 8000L, PROMPT)
                        .thinking(adaptive)
                        .outputConfig(OutputConfig.builder().effort(OutputConfig.Effort.LOW).build())
                        .build());
        run("B2 · sonnet, effort high", Client.BIG_MODEL,
                base(Client.BIG_MODEL, 8000L, PROMPT)
                        .thinking(adaptive)
                        .outputConfig(OutputConfig.builder().effort(OutputConfig.Effort.HIGH).build())
                        .build());

        // The old knob, on the new model — Exercise 3's lesson, one generation later.
        run("B3 · sonnet, budgetTokens (expect a 400)", Client.BIG_MODEL,
                base(Client.BIG_MODEL, 4096L, PROMPT)
                        .thinking(ThinkingConfigEnabled.builder().budgetTokens(2048L).build())
                        .build());

        // ══ Part C ══════════════════════════════════════════════════════
        // The top of the range. Five times Haiku's price per token, and it
        // tends to spend more tokens too. Is the answer five times better?
        System.out.println("══ PART C — Opus 5: what the top of the range buys ══════");
        System.out.println();

        run("C1 · opus, effort high", Client.OPUS_MODEL,
                base(Client.OPUS_MODEL, 8000L, PROMPT)
                        .thinking(adaptive)
                        .outputConfig(OutputConfig.builder().effort(OutputConfig.Effort.HIGH).build())
                        .build());

        // ══ Part D ══════════════════════════════════════════════════════
        // Make it hallucinate. The question asks for three things nobody can
        // supply: timings from a query that was never run, a setting that does
        // not exist and an extension that does not exist. Then ask again with
        // permission to say no.
        System.out.println("══ PART D — hallucination bait ══════════════════════════");
        System.out.println();
        System.out.println("  Neither enable_turbo_scan nor pg_fastcount exists. No model");
        System.out.println("  can know timings for a query it never ran.");
        System.out.println();

        run("D1 · haiku, bait", Client.MODEL, base(Client.MODEL, 1024L, BAIT).build());
        run("D2 · haiku, bait + grounding", Client.MODEL,
                base(Client.MODEL, 1024L, GROUNDED).build());

        System.out.println("  Read D1 slowly. Does it invent a config line? A version number?");
        System.out.println("  A millisecond figure? Then read D2: two sentences of permission");
        System.out.println("  usually beat a bigger model — the gap was the prompt, not the brain.");
        System.out.println();

        // ══ Summary ═════════════════════════════════════════════════════
        System.out.println("══ SUMMARY ══════════════════════════════════════════════");
        System.out.println();
        System.out.println("  call                               sec    out  think        $");
        double total = 0;
        for (Row r : ROWS) {
            System.out.printf("  %-33s %5.1f %6d %6d %8.4f%n",
                    r.label(), r.ms() / 1000.0, r.output(), r.thinking(), r.cost());
            total += r.cost();
        }
        System.out.printf("%n  total for this run: $%.4f%n", total);

        System.out.println("""

                TO DO — write in findings.md:

                  1. Which call was the first to say that DATE(sent_at) stops the planner
                     using an index on sent_at? Which ones never said it?
                  2. A1 vs A2: what did thinking change — the ranking, the correctness,
                     or only the length? What did it cost in tokens?
                  3. B1 vs B2 vs C1: was the most expensive answer the best one? Put a
                     number on it: dollars per correct recommendation.
                  4. What did B3 return, and why does that make budgetTokens a quirk
                     that belongs in Client.java?
                  5. Quote the most confident invented thing from D1 exactly. Did D2
                     fix it? What does that tell you about where hallucination comes from?
                """);
    }
}
