package lab;

import com.anthropic.errors.AnthropicServiceException;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;

/**
 * Exercise 3 — turn the two knobs.
 *
 * <pre>
 *     ./gradlew run -Pex=3              (or: ./gradlew ex3)
 * </pre>
 *
 * <p>Goal: feel what {@code temperature} and {@code maxTokens} actually do.
 *
 * <ul>
 *   <li>temperature — how much randomness is allowed when picking the next
 *       token. 0 = always take the most likely one. 1 = sample freely.
 *   <li>maxTokens — a hard ceiling on the reply. The model is NOT told about
 *       it; it simply gets cut off mid-thought when it runs out.
 * </ul>
 *
 * <p><b>Important, and not obvious.</b> {@code temperature} has been REMOVED
 * from the current frontier models. Sending a non-default temperature to
 * claude-sonnet-5, claude-opus-5 or claude-opus-4-8 returns HTTP 400. Those
 * models are steered by prompting instead.
 *
 * <p>This lab pins claude-haiku-4-5, which still has the knob. Part C below
 * demonstrates the 400 on purpose, because "the parameter I relied on was
 * removed in the next model generation" is a real thing that will happen to
 * you, and seeing the error once is worth more than reading about it.
 *
 * <p><b>Expect a compiler warning here.</b> Building this file prints
 * "{@code temperature(double) in Builder has been deprecated}". That is not a
 * mistake in the lab — the SDK authors deprecated the method for exactly the
 * reason Part C demonstrates. Read the warning as the toolchain telling you
 * the same thing the API will: this knob is on its way out.
 */
public final class Ex03Knobs {

    private static final String PROMPT = "Invent a name for a SQL engine. Reply with just the name.";

    private static Message ask(double temperature, long maxTokens) {
        return Client.get().messages().create(
                MessageCreateParams.builder()
                        .model(Client.MODEL)
                        .temperature(temperature)
                        .maxTokens(maxTokens)
                        .addUserMessage(PROMPT)
                        .build());
    }

    public static void main(String[] args) {
        // ══ Part A ══════════════════════════════════════════════════════
        // temperature 0 twice, then temperature 1 twice. Same prompt each time.
        System.out.println();
        System.out.println("══ PART A — determinism vs variety ══════════════════════");
        System.out.println();
        System.out.println("  prompt: \"" + PROMPT + "\"");
        System.out.println();

        String c1 = Client.textOf(ask(0, 64)).trim();
        String c2 = Client.textOf(ask(0, 64)).trim();
        String h1 = Client.textOf(ask(1, 64)).trim();
        String h2 = Client.textOf(ask(1, 64)).trim();

        System.out.println("  temperature 0 —");
        System.out.println("    run 1: " + c1);
        System.out.println("    run 2: " + c2);
        System.out.println("    identical? " + (c1.equals(c2) ? "YES" : "no"));
        System.out.println();

        System.out.println("  temperature 1 —");
        System.out.println("    run 1: " + h1);
        System.out.println("    run 2: " + h2);
        System.out.println("    identical? " + (h1.equals(h2) ? "YES" : "no"));
        System.out.println();

        System.out.println("  Note: temperature 0 means 'always pick the most likely token'.");
        System.out.println("  That makes it near-deterministic, but it has never been a");
        System.out.println("  guarantee — batching and hardware can still cause drift.");
        System.out.println();

        // ══ Part B ══════════════════════════════════════════════════════
        // Ask for something long, then refuse to give it room.
        System.out.println("══ PART B — maxTokens truncation ════════════════════════");
        System.out.println();

        String longQuestion = "Explain in about 200 words how a database index works.";

        Message truncated = Client.get().messages().create(
                MessageCreateParams.builder()
                        .model(Client.MODEL)
                        .maxTokens(30L) // deliberately far too small
                        .addUserMessage(longQuestion)
                        .build());

        System.out.println("  asked for ~200 words with maxTokens: 30 —");
        System.out.println();
        System.out.println("    \"" + Client.textOf(truncated).trim() + "\"");
        System.out.println();
        System.out.println("    stop_reason:   " + Client.stopReasonOf(truncated));
        System.out.println("    output_tokens: " + truncated.usage().outputTokens());
        System.out.println();
        System.out.println("  stop_reason 'max_tokens' means it was CUT OFF, not finished.");
        System.out.println("  Always check stop_reason before trusting a reply — a truncated");
        System.out.println("  answer looks like a real answer right up until it doesn't.");
        System.out.println();

        // For contrast: the same question with room to breathe.
        Message roomy = Client.get().messages().create(
                MessageCreateParams.builder()
                        .model(Client.MODEL)
                        .maxTokens(400L)
                        .addUserMessage(longQuestion)
                        .build());
        System.out.println("  same question, maxTokens: 400 → stop_reason: "
                + Client.stopReasonOf(roomy));
        System.out.printf("  (%d output tokens — it finished on its own)%n",
                roomy.usage().outputTokens());
        System.out.println();

        // ══ Part C ══════════════════════════════════════════════════════
        // The knob does not exist on newer models. Prove it.
        System.out.println("══ PART C — the knob that was removed ═══════════════════");
        System.out.println();
        System.out.println("  Sending temperature: 1 to " + Client.BIG_MODEL + " …");
        System.out.println();

        try {
            Client.get().messages().create(
                    MessageCreateParams.builder()
                            .model(Client.BIG_MODEL)
                            .temperature(1)
                            .maxTokens(64L)
                            .addUserMessage(PROMPT)
                            .build());
            System.out.println("  … it was accepted. The API may have changed again —");
            System.out.println("     check the current docs and update Client.java.");
            System.out.println();
        } catch (AnthropicServiceException e) {
            if (e.statusCode() == 400) {
                String msg = String.valueOf(e.getMessage());
                System.out.println("  ✓ rejected with HTTP 400, exactly as documented:");
                System.out.println("    " + msg.substring(0, Math.min(msg.length(), 160)));
                System.out.println();
                System.out.println("  This is the lesson: a model generation can remove a parameter");
                System.out.println("  you depend on. Keep model ids and their quirks in ONE class");
                System.out.println("  (Client.java), not scattered across every call site.");
                System.out.println();
            } else {
                System.out.println("  unexpected error (" + e.statusCode() + "): " + e.getMessage());
                System.out.println();
            }
        }

        System.out.println("""

                TO DO — write in findings.md:

                  1. Which temperature repeated itself, and how different were the
                     two temperature-1 answers?
                  2. What did stop_reason say when the answer was truncated, and what
                     would happen if your code had just used that text without checking?
                  3. Why does temperature 0 matter for anything a machine will check?
                     (Session 13 builds tests on top of exactly this property.)
                  4. What did claude-sonnet-5 do with temperature, and what does that
                     tell you about hard-coding model ids?
                """);
    }
}
