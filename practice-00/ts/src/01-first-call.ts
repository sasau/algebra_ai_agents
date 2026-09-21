/**
 * Exercise 1 — your first Messages API call.
 *
 *     npm run ex1
 *
 * Goal: prompt in → text out → read the token meter.
 *
 * This is the smallest real LLM call there is. Every agent you build this term
 * is ultimately a loop around this one function call.
 */
import { client, MODEL, textOf, reportUsage } from "./client.js";

const QUESTION = "In one sentence, what is a primary key?";

console.log(`\nAsking (${MODEL}): "${QUESTION}"\n`);

const res = await client.messages.create({
  model: MODEL,
  max_tokens: 256,
  messages: [{ role: "user", content: QUESTION }],
});

console.log("─ reply ───────────────────────────────────────────────");
console.log(textOf(res));
console.log("───────────────────────────────────────────────────────\n");

reportUsage("usage", res.usage);
console.log(`   stop_reason: ${res.stop_reason}`);

// --- the token meter, made concrete --------------------------------------
// The lecture's rule of thumb is that one token is about ¾ of a word. Here we
// check that against the actual counts, because a number you verified yourself
// is worth more than a number you were told.
const promptWords = QUESTION.split(/\s+/).length;
const replyWords = textOf(res).split(/\s+/).length;

console.log("\n─ token arithmetic ────────────────────────────────────");
console.log(`   prompt: ${promptWords} words → ${res.usage.input_tokens} input tokens`);
console.log(`   reply:  ${replyWords} words → ${res.usage.output_tokens} output tokens`);
console.log(
  `   ratio:  ${(res.usage.output_tokens / Math.max(replyWords, 1)).toFixed(2)} tokens per word`,
);
console.log("───────────────────────────────────────────────────────");

console.log(`
TO DO — run this script twice, then write in findings.md:

  1. Did the two runs return the same text? (No temperature is set here,
     so the default applies — note what you actually observe.)
  2. How close was the tokens-per-word ratio to the lecture's ≈1.33
     (i.e. 1 token ≈ ¾ word)?
  3. input_tokens is larger than the prompt alone. Why? (Hint: the model
     also receives structural tokens marking where your turn starts and ends.)
`);
