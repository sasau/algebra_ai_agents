/**
 * Stretch 1 — watch the generate loop live.
 *
 *     npm run stretch:stream
 *
 * Everything so far waited for the complete answer. Streaming shows you tokens
 * as they are produced — which is what the lecture's "one token at a time" loop
 * actually looks like from outside.
 */
import { client, MODEL } from "./client.js";

console.log("\nStreaming — watch the tokens arrive one at a time:\n");

const started = Date.now();
let tokenEvents = 0;
let firstTokenMs = 0;

const stream = client.messages.stream({
  model: MODEL,
  max_tokens: 300,
  messages: [
    { role: "user", content: "Explain what a JOIN does, in about 80 words." },
  ],
});

stream.on("text", (chunk) => {
  if (tokenEvents === 0) firstTokenMs = Date.now() - started;
  tokenEvents++;
  process.stdout.write(chunk);
});

const final = await stream.finalMessage();
const totalMs = Date.now() - started;

console.log("\n");
console.log("─ what you just watched ───────────────────────────────");
console.log(`   time to first chunk: ${firstTokenMs} ms`);
console.log(`   total time:          ${totalMs} ms`);
console.log(`   chunks received:     ${tokenEvents}`);
console.log(`   output tokens:       ${final.usage.output_tokens}`);
console.log("───────────────────────────────────────────────────────");

console.log(`
The total time is the same either way — streaming does not make the model
faster. What it changes is the WAIT: the user sees progress after
${firstTokenMs} ms instead of ${totalMs} ms.

That gap is why every chat UI streams. It is also why Session 06 cares
about budgets: a loop that runs for a minute needs to show its work.
`);
