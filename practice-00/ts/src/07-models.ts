/**
 * Exercise 7 — same prompt, different brains.
 *
 *     npm run ex7
 *
 * Goal: hold the prompt still and change everything else — the model, whether
 * it thinks, how hard it tries — then watch what that does to the answer, the
 * token count, the latency and the bill. Then make it hallucinate on purpose.
 *
 *   Part A — Haiku 4.5, thinking off vs on (budget_tokens 2048).
 *   Part B — Sonnet 5 at effort "low" vs effort "high".
 *   Part C — Opus 5 at effort "high": what the top of the range buys.
 *   Part D — hallucination bait: a question about things that do not exist,
 *            asked ungrounded and then grounded with permission to say "no".
 *
 * The prompt is prompts/05-reasoning.md — the best one from the Act 2 lab —
 * so every model gets the schema, the facts and the query. What changes the
 * answer from here on is the brain, not the material.
 *
 * ── Two ways to say "think harder", one per model generation ─────────────
 * Haiku 4.5 takes  thinking: { type: "enabled", budget_tokens: N }.
 * Sonnet 5 and Opus 5 REJECT budget_tokens with a 400. They think adaptively
 * by default and are steered with  output_config: { effort: "low" … "max" }.
 * Same lesson as Exercise 3: the knob moved between generations, so the
 * model id and its quirks live in src/client.ts, not at every call site.
 *
 * ── Cost ─────────────────────────────────────────────────────────────────
 * One run makes seven calls and costs roughly $0.10–0.30, most of it Opus.
 * Thinking tokens are billed as output. Run it once, read it, write it down.
 */
import Anthropic from "@anthropic-ai/sdk";
import {
  client,
  MODEL,
  BIG_MODEL,
  OPUS_MODEL,
  textOf,
  thinkingOf,
  thinkingTokensOf,
  costOf,
} from "./client.js";

const PROMPT = `You are a PostgreSQL DBA reviewing this for a junior developer who has never
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
each element is {"fix": string, "reason": string, "risk": string}.`;

// Neither of these exists. PostgreSQL has no enable_turbo_scan setting and
// there is no pg_fastcount extension. A model that answers confidently is
// hallucinating — and it will sound exactly as sure as when it is right.
const BAIT = `On PostgreSQL 16, what are the exact EXPLAIN ANALYZE timings for this
query on a 240-million-row messages table?

SELECT COUNT(*) FROM messages WHERE account_id = 4815;

Also show me the postgresql.conf line that turns on enable_turbo_scan, and the
command to install the pg_fastcount extension, which should make it about 10x
faster.`;

// The same question with two sentences added: stay inside the facts, and an
// explicit, respectable way out. Models guess when guessing looks like the job.
const GROUNDED = `${BAIT}

Use only facts you are certain of. If a setting or extension does not exist,
or a number cannot be known without running the query, say so plainly — "I
don't know" and "that does not exist" are acceptable answers here. Do not
invent settings, extensions or numbers.`;

type Row = {
  label: string;
  model: string;
  ms: number;
  input: number;
  output: number;
  thinking: number;
  cost: number;
  stop: string;
};
const rows: Row[] = [];

const clip = (s: string, n: number) => {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length > n ? `${flat.slice(0, n)} …` : flat;
};

/**
 * One call, fully measured. Prints what the model said, what it thought, and
 * what it cost — and never crashes the run: a model that rejects a parameter
 * is a finding, not a failure.
 */
async function run(
  label: string,
  params: Omit<Anthropic.MessageCreateParamsNonStreaming, "messages">,
  prompt: string = PROMPT,
): Promise<Anthropic.Message | undefined> {
  const started = Date.now();
  try {
    const reply = await client.messages.create({
      ...params,
      messages: [{ role: "user", content: prompt }],
    });
    const ms = Date.now() - started;
    const row: Row = {
      label,
      model: params.model,
      ms,
      input: reply.usage.input_tokens,
      output: reply.usage.output_tokens,
      thinking: thinkingTokensOf(reply.usage),
      cost: costOf(params.model, reply.usage),
      stop: reply.stop_reason ?? "none",
    };
    rows.push(row);

    console.log(`  ▸ ${label}   (${params.model})`);
    console.log(
      `    ${(ms / 1000).toFixed(1)} s · in ${row.input} · out ${row.output}` +
        ` (of which thinking ${row.thinking}) · $${row.cost.toFixed(4)}` +
        ` · stop_reason ${row.stop}`,
    );
    const thought = thinkingOf(reply);
    if (thought) console.log(`    thinking: "${clip(thought, 220)}"`);
    console.log(`    answer:   "${clip(textOf(reply), 420)}"\n`);
    return reply;
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.log(`  ▸ ${label}   (${params.model})`);
    console.log(`    ✗ HTTP ${e.status ?? "?"}: ${clip(e.message ?? "", 200)}\n`);
    return undefined;
  }
}

// ══ Part A ═══════════════════════════════════════════════════════════════
// The cheap model, twice: answer straight away vs think first.
// budget_tokens must be ≥ 1024 and < max_tokens, and the thinking it buys is
// billed as output — so "think harder" shows up on the bill, not just the clock.
console.log("\n══ PART A — Haiku 4.5: thinking off vs on ═══════════════\n");

await run("A1 · haiku, no thinking", { model: MODEL, max_tokens: 4096 });
await run("A2 · haiku, thinking 2048", {
  model: MODEL,
  max_tokens: 4096,
  thinking: { type: "enabled", budget_tokens: 2048 },
});

console.log("  Same prompt, same model. Did thinking change the ranking, or");
console.log("  just the length? Did A1 miss that DATE(sent_at) blocks an index?\n");

// ══ Part B ═══════════════════════════════════════════════════════════════
// The frontier model has no budget_tokens (a 400 if you send it). It thinks
// on its own, and effort is how you tell it how hard to try. display
// "summarized" asks for the thinking text back — the default returns it empty.
console.log("══ PART B — Sonnet 5: effort low vs high ════════════════\n");

await run("B1 · sonnet, effort low", {
  model: BIG_MODEL,
  max_tokens: 8000,
  thinking: { type: "adaptive", display: "summarized" },
  output_config: { effort: "low" },
});
await run("B2 · sonnet, effort high", {
  model: BIG_MODEL,
  max_tokens: 8000,
  thinking: { type: "adaptive", display: "summarized" },
  output_config: { effort: "high" },
});

// The old knob, on the new model — Exercise 3's lesson, one generation later.
await run("B3 · sonnet, budget_tokens (expect a 400)", {
  model: BIG_MODEL,
  max_tokens: 4096,
  thinking: { type: "enabled", budget_tokens: 2048 },
});

// ══ Part C ═══════════════════════════════════════════════════════════════
// The top of the range. Five times Haiku's price per token, and it tends to
// spend more tokens too. Is the answer five times better? Is it better at all?
console.log("══ PART C — Opus 5: what the top of the range buys ══════\n");

await run("C1 · opus, effort high", {
  model: OPUS_MODEL,
  max_tokens: 8000,
  thinking: { type: "adaptive", display: "summarized" },
  output_config: { effort: "high" },
});

// ══ Part D ═══════════════════════════════════════════════════════════════
// Make it hallucinate. The question asks for three things nobody can supply:
// timings from a query that was never run, a setting that does not exist and
// an extension that does not exist. Then ask again with permission to say no.
console.log("══ PART D — hallucination bait ══════════════════════════\n");
console.log("  Neither enable_turbo_scan nor pg_fastcount exists. No model");
console.log("  can know timings for a query it never ran.\n");

await run("D1 · haiku, bait", { model: MODEL, max_tokens: 1024 }, BAIT);
await run("D2 · haiku, bait + grounding", { model: MODEL, max_tokens: 1024 }, GROUNDED);

console.log("  Read D1 slowly. Does it invent a config line? A version number?");
console.log("  A millisecond figure? Then read D2: two sentences of permission");
console.log("  usually beat a bigger model — the gap was the prompt, not the brain.\n");

// ══ Summary ══════════════════════════════════════════════════════════════
console.log("══ SUMMARY ══════════════════════════════════════════════\n");
console.log("  call                               sec    out  think        $");
for (const r of rows) {
  console.log(
    `  ${r.label.padEnd(33)} ${(r.ms / 1000).toFixed(1).padStart(5)}` +
      ` ${String(r.output).padStart(6)} ${String(r.thinking).padStart(6)}` +
      ` ${r.cost.toFixed(4).padStart(8)}`,
  );
}
const total = rows.reduce((sum, r) => sum + r.cost, 0);
console.log(`\n  total for this run: $${total.toFixed(4)}\n`);

console.log(`
TO DO — write in findings.md:

  1. Which call was the first to say that DATE(sent_at) stops the planner
     using an index on sent_at? Which ones never said it?
  2. A1 vs A2: what did thinking change — the ranking, the correctness,
     or only the length? What did it cost in tokens?
  3. B1 vs B2 vs C1: was the most expensive answer the best one? Put a
     number on it: dollars per correct recommendation.
  4. What did B3 return, and why does that make budget_tokens a quirk
     that belongs in src/client.ts?
  5. Quote the most confident invented thing from D1 exactly. Did D2
     fix it? What does that tell you about where hallucination comes from?
`);
