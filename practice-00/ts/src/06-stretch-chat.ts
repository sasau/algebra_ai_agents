/**
 * Stretch 2 — your own 30-line chatbox.
 *
 *     npm run stretch:chat
 *
 * Exercise 2 in a loop: read a line, append it to the history, send the whole
 * history, append the reply. Type /tokens to see what the conversation costs
 * so far, /reset to clear it, /quit to leave.
 *
 * There is no framework here. A chat app IS this loop.
 */
import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import type Anthropic from "@anthropic-ai/sdk";
import { client, MODEL, textOf } from "./client.js";

const messages: Anthropic.MessageParam[] = [];
let turns = 0;
let lastInputTokens = 0;
let totalOutputTokens = 0;

const rl = readline.createInterface({ input: stdin, output: stdout });

console.log(`
┌─────────────────────────────────────────────────────────┐
│  Practice 00 — study buddy                              │
│  model: ${MODEL.padEnd(48)}│
│                                                         │
│  /tokens   what this conversation costs so far          │
│  /reset    forget everything                            │
│  /quit     exit                                         │
└─────────────────────────────────────────────────────────┘
`);

while (true) {
  const input = (await rl.question("you  → ")).trim();

  if (!input) continue;

  if (input === "/quit") break;

  if (input === "/reset") {
    messages.length = 0;
    turns = 0;
    lastInputTokens = 0;
    totalOutputTokens = 0;
    console.log("      (history cleared — it has no idea who you are again)\n");
    continue;
  }

  if (input === "/tokens") {
    console.log(`      turns:                 ${turns}`);
    console.log(`      messages in history:   ${messages.length}`);
    console.log(`      last turn's input:     ${lastInputTokens} tokens`);
    console.log(`      output so far:         ${totalOutputTokens} tokens`);
    console.log("      (input is re-sent in full every single turn)\n");
    continue;
  }

  messages.push({ role: "user", content: input });

  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      messages,
    });

    messages.push({ role: "assistant", content: res.content });
    turns++;
    lastInputTokens = res.usage.input_tokens;
    totalOutputTokens += res.usage.output_tokens;

    console.log(`model→ ${textOf(res).trim()}`);
    console.log(`      [in ${res.usage.input_tokens} · out ${res.usage.output_tokens}]\n`);
  } catch (err) {
    const e = err as { status?: number; message?: string };
    console.log(`      ✗ API error${e.status ? ` (${e.status})` : ""}: ${e.message}\n`);
    // Drop the user turn we could not answer, so the history stays valid.
    messages.pop();
  }
}

rl.close();

console.log(`
Done. ${turns} turns, ${totalOutputTokens} output tokens.

Notice what you did NOT write: any memory system. The \`messages\` array
was the memory. Session 08 asks the obvious next question — what happens
when that array no longer fits?
`);
