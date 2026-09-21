/**
 * Exercise 4 — make it return JSON.
 *
 *     npm run ex4
 *
 * Goal: turn the model from a chatbot into a component.
 *
 * Prose is for humans. If your program needs to USE the answer — put it in a
 * variable, branch on it, store it — the answer has to be structured. This is
 * the step that makes every later session possible: a tool call (Session 02)
 * is just JSON the model produced and your code executed.
 */
import { client, MODEL, textOf } from "./client.js";

const SENTENCE = "lusql v0.0.1 ships today";

// ══ Part A ═══════════════════════════════════════════════════════════════
// No system prompt. Watch what you get back.
console.log("\n══ PART A — asking without structure ════════════════════\n");

const loose = await client.messages.create({
  model: MODEL,
  max_tokens: 256,
  temperature: 0,
  messages: [
    { role: "user", content: `Extract the name and version from: '${SENTENCE}'` },
  ],
});

console.log("  raw reply:");
console.log(`    ${textOf(loose).trim().replace(/\n/g, "\n    ")}\n`);
console.log("  A human reads that fine. JSON.parse would throw on it.\n");

// ══ Part B ═══════════════════════════════════════════════════════════════
// A system prompt sets the rules for the whole conversation.
console.log("══ PART B — a system prompt that forces JSON ════════════\n");

const SYSTEM = "You are a data extractor. Reply with ONLY valid JSON, no prose.";

const strict = await client.messages.create({
  model: MODEL,
  max_tokens: 256,
  temperature: 0,
  system: SYSTEM,
  messages: [
    {
      role: "user",
      content: `Extract name and version as {"name": string, "version": string} from: '${SENTENCE}'`,
    },
  ],
});

const raw = textOf(strict).trim();
console.log("  raw reply:");
console.log(`    ${raw.replace(/\n/g, "\n    ")}\n`);

// ══ Part C ═══════════════════════════════════════════════════════════════
// Parse it — defensively. This helper is the real deliverable of the exercise.
console.log("══ PART C — parsing it safely ═══════════════════════════\n");

/**
 * Models love to wrap JSON in ```json fences or open with "Here you go:".
 * Naive JSON.parse throws on both. This strips the common wrappers before
 * parsing, and reports the raw text when it still fails — so you can see WHAT
 * the model said instead of just "Unexpected token".
 *
 * You will reuse this pattern every time you parse model output.
 */
function parseJson<T>(text: string): { ok: true; value: T } | { ok: false; error: string } {
  // 1. strip markdown code fences, if present
  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  // 2. if there is still prose around it, grab the outermost {...} or [...]
  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    const match = cleaned.match(/[{[][\s\S]*[}\]]/);
    if (match) cleaned = match[0];
  }

  try {
    return { ok: true, value: JSON.parse(cleaned) as T };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

type Extracted = { name?: string; version?: string };

const parsed = parseJson<Extracted>(raw);

if (parsed.ok) {
  console.log("  ✓ parsed into a real object:");
  console.log(`      name    = ${JSON.stringify(parsed.value.name)}`);
  console.log(`      version = ${JSON.stringify(parsed.value.version)}`);
  console.log("\n  That is now data. Your program can branch on it, store it,");
  console.log("  pass it to another function. The LLM just became a component.\n");
} else {
  console.log(`  ✗ parse failed: ${parsed.error}`);
  console.log(`    raw text was: ${raw}`);
  console.log("\n  Tighten the system prompt and run again.\n");
}

// ══ Part D ═══════════════════════════════════════════════════════════════
// The honesty check. Structured output does not mean correct output.
console.log("══ PART D — structured ≠ true ═══════════════════════════\n");

const invented = await client.messages.create({
  model: MODEL,
  max_tokens: 256,
  temperature: 0,
  system: SYSTEM,
  messages: [
    {
      role: "user",
      content:
        'Reply as {"answer": string, "confident": boolean}. ' +
        "What is the release date of lusql version 7.3?",
    },
  ],
});

console.log("  asked about a version that does not exist:");
console.log(`    ${textOf(invented).trim().replace(/\n/g, "\n    ")}\n`);
console.log("  If it produced a confident date, you just caught a hallucination");
console.log("  in perfectly valid JSON. Well-formed and wrong is the dangerous");
console.log("  combination — the schema check passes and the fact is invented.\n");
console.log("  This is why Session 09 adds human approval and Session 13 adds");
console.log("  evals. Structure buys you parseability, never truth.\n");

console.log(`
TO DO — write in findings.md:

  1. Paste Part A's reply next to Part B's. What did the system prompt change?
  2. Did your reply need the fence-stripping in parseJson, or was it clean?
  3. Part D: did the model invent a date? Paste exactly what it said —
     that is the hallucination your findings.md needs to record.
`);
