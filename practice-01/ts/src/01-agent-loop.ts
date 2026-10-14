/**
 * Exercise 1 — the agent loop, written by hand.
 *
 *     npm run agent
 *     npm run agent -- --max-steps 3      # watch the budget fire instead
 *
 * Goal: see the five parts of an agent as five constants and one loop, and
 * read the printed transcript as a labelled trace — [P]erceive · [D]ecide ·
 * [A]ct · [O]bserve — with nothing hidden.
 *
 * Every API call in this file is the same `client.messages.create` you made in
 * Practice 00. What makes it an agent is only what sits around it: a goal, a
 * list of tools, a growing message array, and a loop with two ways to stop.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { spawnSync } from "node:child_process";
import { client, MODEL, MAX_STEPS, MAX_TOKENS, textOf, costOf } from "./client.js";
import { PRACTICE_ROOT } from "./env.js";
import { TOOLS, runTool, useTarget } from "./tools.js";

// ── the five parts, named ───────────────────────────────────────────────────

/**
 * Part 1 of 5 — the GOAL. The only thing the human writes per run.
 *
 * It is testable (the model can run `npm test` and read 0 or 1), it carries
 * one constraint, and it says when to stop. Same wording in every track.
 */
const GOAL =
  "Make `npm test` pass in the parser project. Do not edit anything under `test/`. Stop when it is green.";

/**
 * The system prompt frames the role. Two sentences: who the model is, and how
 * the model can signal the end of its turn (part 5) with text and no tool
 * call. The API reports end_turn; the independent test later checks success.
 */
const SYSTEM =
  "You are a coding agent working in a small TypeScript project; use the tools to read files, change the source and run the tests. " +
  "When the tests are green, reply with one line saying so and stop.";

// Part 2 (MODEL), part 3 (TOOLS) and the budget half of part 5 (MAX_STEPS) are
// imported above — see client.ts and tools.ts. They are not defined here on
// purpose: the loop should read as a loop, and the knobs should live together.

// ── flags ───────────────────────────────────────────────────────────────────

/** `--max-steps N` overrides the budget for one run; the default stays in client.ts. */
const flagAt = process.argv.indexOf("--max-steps");
const maxSteps = flagAt === -1 ? MAX_STEPS : Number(process.argv[flagAt + 1]);
if (!Number.isInteger(maxSteps) || maxSteps < 1) {
  console.error("\n✗ --max-steps needs a positive whole number, e.g.  npm run agent -- --max-steps 3\n");
  process.exit(2);
}

// Fresh copy for every run: the supplied parser and previous evidence stay untouched.
const prepared = spawnSync(process.execPath, ["scripts/prepare-run.mjs", "act2-ts"], {
  cwd: PRACTICE_ROOT, encoding: "utf8",
});
if (prepared.status !== 0) throw new Error(prepared.stderr || "could not prepare an isolated run");
const target = prepared.stdout.trim();
useTarget(target);
console.log(`Run directory: ${target}`);

// ── small printers for the trace ────────────────────────────────────────────

/** One-line view of a tool call's arguments; long strings become their length. */
function summarize(input: unknown): string {
  if (typeof input !== "object" || input === null) return String(input);
  return Object.entries(input as Record<string, unknown>)
    .map(([k, v]) => (typeof v === "string" && v.length > 60 ? `${k}: <${v.length} chars>` : `${k}: ${JSON.stringify(v)}`))
    .join(", ");
}

/** The first `n` non-empty lines of a tool result, indented under its label. */
function head(text: string, n: number): string {
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  const shown = lines.slice(0, n).join("\n    ");
  return lines.length > n ? `${shown}\n    … (+${lines.length - n} more lines)` : shown;
}

// ── the loop ────────────────────────────────────────────────────────────────

/** Running totals, printed at the end whichever way the loop stops. */
const totals = { steps: 0, input: 0, output: 0, cost: 0 };

async function runLoop(): Promise<void> {
  // Part 4 of 5 — MEMORY. The whole history is this one array; it is re-sent
  // on every call, which is why the model "remembers" what it read in step 2
  // when it writes in step 4. Nothing else persists between steps.
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: GOAL }];

  // [P] logs the input supplied to each model call, not hidden model reasoning.

  // Part 5, budget half — `step <= maxSteps` is the loop's own stopping rule.
  for (let step = 1; step <= maxSteps; step++) {
    totals.steps = step;
    console.log(`\n── step ${step}/${maxSteps} ──────────────────────────────────`);
    console.log(`[P] next model call: goal + ${step - 1} tool-result turn(s) (${messages.length} ${messages.length === 1 ? "message" : "messages"})`);

    // DECIDE — one model call, with the tools declared and the history attached.
    const r = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      tools: TOOLS,
      messages,
    });
    totals.input += r.usage.input_tokens;
    totals.output += r.usage.output_tokens;
    totals.cost += costOf(MODEL, r.usage);

    const said = textOf(r).trim();

    // end_turn means the model finished this turn without asking for a tool.
    // It does not prove the goal succeeded; the independent test below decides that.
    if (r.stop_reason === "end_turn") {
      console.log(`[D] model ended turn — checking the goal outside the loop`);
      if (said) console.log(`    ${said.split("\n").join("\n    ")}`);
      return;
    }
    // The model was cut off mid-turn (usually mid-file in a write_file call).
    // Continuing would send a half-written tool call, so stop with the fix.
    if (r.stop_reason === "max_tokens") {
      throw new Error("the model hit the output limit mid-turn (stop_reason: max_tokens) — raise MAX_TOKENS in client.ts");
    }
    if (r.stop_reason !== "tool_use") {
      throw new Error(`unexpected stop_reason: ${String(r.stop_reason)} — the loop only knows end_turn, tool_use and max_tokens`);
    }

    // [D] is the visible response text, not private model reasoning.
    console.log(`[D] ${said || "(no text)"}`);

    // ACT + OBSERVE — one turn may carry several tool_use blocks; run them all,
    // and answer each with a tool_result carrying its id (the API requires every
    // tool_use to be answered, in a single user message, results first).
    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const block of r.content) {
      if (block.type !== "tool_use") continue;
      console.log(`[A] › ${block.name}(${summarize(block.input)})`);
      const out = runTool(block.name, block.input); // your code acts; the model only asked
      console.log(`[O] ${head(out.content, 3)}`);
      results.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: out.content,
        ...(out.is_error ? { is_error: true } : {}),
      });
    }

    // MEMORY grows by exactly one exchange per step: what the model decided,
    // and what the world said back. This is the "observe → perceive" arrow.
    messages.push({ role: "assistant", content: r.content });
    messages.push({ role: "user", content: results });
  }

  // We fell out of the for-loop: the budget stopped us, not the model.
  throw new Error(`budget exhausted after ${maxSteps} steps — the budget half of the stopping condition fired`);
}

let failure: Error | undefined;
let modelEnded = false;
try {
  await runLoop();
  modelEnded = true;
} catch (err) {
  failure = err instanceof Error ? err : new Error(String(err));
}

// ── verify from OUTSIDE the loop (Rule 5) ───────────────────────────────────
// The model said "green" (or ran out of budget). Neither is evidence. The only
// evidence is the test command run by code the model did not write, plus a
// look at what actually changed on disk. This runs whichever way the loop ended.
console.log(`\n── verify from outside ───────────────────────────────`);
const check = runTool("run_tests", {});
const summary = check.content
  .split("\n")
  .filter((l) => /^exit code:|^\s*(Test Files|Tests)\s/.test(l))
  .map((l) => l.trim());
console.log(`   npm test → ${summary.join(" · ") || head(check.content, 3)}`);
const verifiedGreen = !check.is_error && /^exit code: 0(?:\n|$)/.test(check.content);
if (modelEnded && !verifiedGreen) {
  failure = new Error("the model ended its turn, but independent verification found the test still red");
}

const diff = spawnSync("git", ["diff", "--no-index", "--stat", "parser-ts/src", `${target}/src`], { cwd: PRACTICE_ROOT, encoding: "utf8" });
console.log(`   source changes (baseline → isolated run):`);
console.log(`   ${(diff.stdout || "").trim().split("\n").join("\n   ") || "(no source changes)"}`);

console.log(
  `\n   steps used: ${totals.steps}/${maxSteps} · in: ${totals.input} tok · out: ${totals.output} tok · cost: $${totals.cost.toFixed(4)} (${MODEL})`,
);

if (failure) {
  console.error(`\n✗ ${failure.message}\n`);
  process.exit(1);
}

console.log(`
TO DO — write in agent-anatomy.md, part 2:

  1. Copy 8–15 lines of the trace above and keep their [P] [D] [A] [O] labels.
  2. Name the five parts with their instance from THIS run: goal · model ·
     tools · memory · stopping condition (both halves — which one fired?).
  3. Did "verify from outside" confirm the model's final answer? If it did
     not, which of the five rules caught it?
`);
