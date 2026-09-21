/**
 * Exercise 2 — a conversation you build by hand.
 *
 *     npm run ex2
 *
 * Goal: prove that the model has no memory, then build memory yourself by
 * re-sending the history — and watch what that costs.
 *
 * This is the single most important idea in the whole course. "Memory" is not
 * a model feature. It is an array you maintain and re-send. Sessions 08 and 11
 * are entirely about managing that array once it gets too big to re-send.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { client, MODEL, textOf } from "./client.js";

const ask = (messages: Anthropic.MessageParam[]) =>
  client.messages.create({ model: MODEL, max_tokens: 128, messages });

// ══ Part A ═══════════════════════════════════════════════════════════════
// Two separate calls. The second one has no idea the first ever happened.
console.log("\n══ PART A — two separate calls (statelessness) ═══════════\n");

const a1 = await ask([{ role: "user", content: "My name is Ada. Remember it." }]);
console.log(`  you  → "My name is Ada. Remember it."`);
console.log(`  model→ ${textOf(a1).trim()}\n`);

const a2 = await ask([{ role: "user", content: "What is my name?" }]);
console.log(`  you  → "What is my name?"   (a brand-new call)`);
console.log(`  model→ ${textOf(a2).trim()}\n`);

console.log("  ↑ It does not know. Nothing carried over. The model is a");
console.log("    pure function: same input in, answer out, then it forgets.\n");

// ══ Part B ═══════════════════════════════════════════════════════════════
// Same two questions — but now we carry the history ourselves.
console.log("══ PART B — one growing messages array (memory) ══════════\n");

const messages: Anthropic.MessageParam[] = [
  { role: "user", content: "My name is Ada. Remember it." },
];

const b1 = await ask(messages);
console.log(`  turn 1  you  → "My name is Ada. Remember it."`);
console.log(`          model→ ${textOf(b1).trim()}`);
console.log(`          input_tokens: ${b1.usage.input_tokens}\n`);

// The two lines that create "memory": push the reply, then push the follow-up.
messages.push({ role: "assistant", content: b1.content });
messages.push({ role: "user", content: "What is my name?" });

const b2 = await ask(messages);
console.log(`  turn 2  you  → "What is my name?"   (with history attached)`);
console.log(`          model→ ${textOf(b2).trim()}`);
console.log(`          input_tokens: ${b2.usage.input_tokens}\n`);

// ══ Part C ═══════════════════════════════════════════════════════════════
// Keep going, and watch the bill grow. Every turn re-sends everything before it.
console.log("══ PART C — what re-sending history costs ═══════════════\n");

const followUps = [
  "Spell my name backwards.",
  "How many letters does it have?",
  "Use it in a sentence about databases.",
];

const growth: number[] = [b1.usage.input_tokens, b2.usage.input_tokens];

// Close off turn 2 so the array ends on an assistant turn, ready for the loop.
messages.push({ role: "assistant", content: b2.content });

for (const [i, q] of followUps.entries()) {
  const prev = growth[growth.length - 1]!;

  messages.push({ role: "user", content: q });
  const r = await ask(messages);
  messages.push({ role: "assistant", content: r.content });

  growth.push(r.usage.input_tokens);
  console.log(
    `  turn ${i + 3}  input_tokens: ${String(r.usage.input_tokens).padStart(4)}` +
      `  (+${r.usage.input_tokens - prev} vs previous turn)`,
  );
}

const first = growth[0]!;
const last = growth[growth.length - 1]!;

console.log("\n─ the shape of the problem ────────────────────────────");
console.log(`   turn 1 cost you ${first} input tokens.`);
console.log(`   turn ${growth.length} cost you ${last} — a ${(last / first).toFixed(1)}× increase.`);
console.log(`   growth curve: ${growth.join(" → ")}`);
console.log("───────────────────────────────────────────────────────");

console.log(`
TO DO — write in findings.md:

  1. Paste the growth curve above. Is it linear, or worse?
  2. You pay for input tokens on EVERY turn. A 50-turn conversation
     re-sends turn 1 fifty times. What does that imply about cost?
  3. The context window is finite (Haiku 4.5: 200K tokens). At this
     growth rate, roughly how many turns until you hit the wall?

  This is the problem Session 08 (memory) and Session 11 (context
  management) exist to solve. You just met it first-hand.
`);
