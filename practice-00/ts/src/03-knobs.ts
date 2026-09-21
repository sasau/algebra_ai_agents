/**
 * Exercise 3 — turn the two knobs.
 *
 *     npm run ex3
 *
 * Goal: feel what `temperature` and `max_tokens` actually do.
 *
 *   temperature — how much randomness is allowed when picking the next token.
 *                 0 = always take the most likely token. 1 = sample freely.
 *   max_tokens  — a hard ceiling on the reply. The model is NOT told about it;
 *                 it simply gets cut off mid-thought when it runs out.
 *
 * ── Important, and not obvious ──────────────────────────────────────────
 * `temperature` has been REMOVED from the current frontier models. Sending a
 * non-default temperature to claude-sonnet-5, claude-opus-5 or claude-opus-4-8
 * returns HTTP 400. Those models are steered by prompting instead.
 *
 * This lab pins claude-haiku-4-5, which still has the knob. Part C below
 * demonstrates the 400 on purpose, because "the parameter I relied on was
 * removed in the next model generation" is a real thing that will happen to
 * you, and seeing the error once is worth more than reading about it.
 */
import { client, MODEL, BIG_MODEL, textOf } from "./client.js";

const PROMPT = "Invent a name for a SQL engine. Reply with just the name.";

const ask = (temperature: number, max_tokens: number) =>
  client.messages.create({
    model: MODEL,
    temperature,
    max_tokens,
    messages: [{ role: "user", content: PROMPT }],
  });

// ══ Part A ═══════════════════════════════════════════════════════════════
// temperature 0 twice, then temperature 1 twice. Same prompt every time.
console.log("\n══ PART A — determinism vs variety ══════════════════════\n");
console.log(`  prompt: "${PROMPT}"\n`);

const [cold1, cold2] = await Promise.all([ask(0, 64), ask(0, 64)]);
const [hot1, hot2] = await Promise.all([ask(1, 64), ask(1, 64)]);

const c1 = textOf(cold1).trim();
const c2 = textOf(cold2).trim();
const h1 = textOf(hot1).trim();
const h2 = textOf(hot2).trim();

console.log("  temperature 0 —");
console.log(`    run 1: ${c1}`);
console.log(`    run 2: ${c2}`);
console.log(`    identical? ${c1 === c2 ? "YES" : "no"}\n`);

console.log("  temperature 1 —");
console.log(`    run 1: ${h1}`);
console.log(`    run 2: ${h2}`);
console.log(`    identical? ${h1 === h2 ? "YES" : "no"}\n`);

console.log("  Note: temperature 0 means 'always pick the most likely token'.");
console.log("  That makes it near-deterministic, but it has never been a");
console.log("  guarantee — batching and hardware can still cause drift.\n");

// ══ Part B ═══════════════════════════════════════════════════════════════
// Ask for something long, then refuse to give it room.
console.log("══ PART B — max_tokens truncation ═══════════════════════\n");

const long = await client.messages.create({
  model: MODEL,
  max_tokens: 30, // deliberately far too small
  messages: [
    {
      role: "user",
      content: "Explain in about 200 words how a database index works.",
    },
  ],
});

console.log("  asked for ~200 words with max_tokens: 30 —\n");
console.log(`    "${textOf(long).trim()}"\n`);
console.log(`    stop_reason:   ${long.stop_reason}`);
console.log(`    output_tokens: ${long.usage.output_tokens}\n`);
console.log("  stop_reason 'max_tokens' means it was CUT OFF, not finished.");
console.log("  Always check stop_reason before trusting a reply — a truncated");
console.log("  answer looks like a real answer right up until it doesn't.\n");

// For contrast: the same question with room to breathe.
const roomy = await client.messages.create({
  model: MODEL,
  max_tokens: 400,
  messages: [
    {
      role: "user",
      content: "Explain in about 200 words how a database index works.",
    },
  ],
});
console.log(`  same question, max_tokens: 400 → stop_reason: ${roomy.stop_reason}`);
console.log(`  (${roomy.usage.output_tokens} output tokens — it finished on its own)\n`);

// ══ Part C ═══════════════════════════════════════════════════════════════
// The knob does not exist on newer models. Prove it.
console.log("══ PART C — the knob that was removed ═══════════════════\n");
console.log(`  Sending temperature: 1 to ${BIG_MODEL} …\n`);

try {
  await client.messages.create({
    model: BIG_MODEL,
    temperature: 1,
    max_tokens: 64,
    messages: [{ role: "user", content: PROMPT }],
  });
  console.log("  … it was accepted. The API may have changed again —");
  console.log("     check the current docs and update src/client.ts.\n");
} catch (err) {
  const e = err as { status?: number; message?: string };
  if (e.status === 400) {
    console.log(`  ✓ rejected with HTTP 400, exactly as documented:`);
    console.log(`    ${(e.message ?? "").slice(0, 160)}\n`);
    console.log("  This is the lesson: a model generation can remove a parameter");
    console.log("  you depend on. Keep model ids and their quirks in ONE module");
    console.log("  (src/client.ts), not scattered across every call site.\n");
  } else {
    console.log(`  unexpected error (${e.status}): ${e.message}\n`);
  }
}

console.log(`
TO DO — write in findings.md:

  1. Which temperature repeated itself, and how different were the
     two temperature-1 answers?
  2. What did stop_reason say when the answer was truncated, and what
     would happen if your code had just used that text without checking?
  3. Why does temperature 0 matter for anything a machine will check?
     (Session 13 builds tests on top of exactly this property.)
  4. What did ${BIG_MODEL} do with temperature, and what does that
     tell you about hard-coding model ids?
`);
