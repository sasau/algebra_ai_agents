/**
 * Shared setup for the agent loop.
 *
 * This is the ONLY file that knows a model id, a price, or a limit. The loop
 * imports them from here — so when a model is renamed or the class needs a
 * tighter budget, exactly one file changes. (Practice 00, Exercise 3, is why.)
 */
import "./env.js"; // loads practice-01/.env before anything reads process.env
import Anthropic from "@anthropic-ai/sdk";

// --- fail loudly and early if the key is missing -------------------------
// Without this you get a confusing 401 from deep inside the SDK instead of a
// sentence telling you what to do about it.
if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    [
      "",
      "✗ ANTHROPIC_API_KEY is not set.",
      "",
      "  Fix it one of two ways, from the practice-01 folder:",
      "    1. cp .env.example .env   then put your key in .env   (recommended)",
      "    2. export ANTHROPIC_API_KEY='sk-ant-...'              (this shell only)",
      "",
      "  Get a key at https://console.anthropic.com/settings/keys",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

/** Reads ANTHROPIC_API_KEY from the environment automatically. */
export const client = new Anthropic();

/**
 * The model the loop calls — part 2 of the five parts (goal · MODEL · tools ·
 * memory · stopping condition).
 *
 * Haiku 4.5 is the cheapest current model ($1/$5 per million tokens) and it is
 * fast. Both matter here more than in Practice 00: an agent calls the model
 * once PER STEP, and the whole conversation so far is re-sent every time, so
 * a twelve-step run costs roughly twelve growing calls, not one.
 */
export const MODEL = "claude-haiku-4-5";

/**
 * Price per million tokens, in dollars, for every model this lab calls.
 * Lives here for the same reason the id does: one place to change it.
 */
export const PRICING: Record<string, { input: number; output: number }> = {
  [MODEL]: { input: 1, output: 5 },
};

/**
 * The budget half of the stopping condition — part 5 of the five parts.
 *
 * The loop gives up after this many model calls, whatever the model thinks.
 * Twelve is generous for a six-line fix (a good run takes 4–6 steps); it is
 * there so that a confused model costs you cents, not dollars. Override it
 * for one run with `npm run agent -- --max-steps 3` to watch it fire.
 */
export const MAX_STEPS = 12;

/**
 * The most output tokens one model turn may produce.
 *
 * A turn that rewrites parser.ts needs the whole file in a tool call, so this
 * is well above Practice 00's 256. If a turn still hits the ceiling, the API
 * returns `stop_reason: "max_tokens"` and the loop stops with a clear error
 * telling you to raise this number.
 */
export const MAX_TOKENS = 2048;

/**
 * Why Haiku, and not the mid-tier model you may have read about:
 *
 *   `claude-sonnet-5` — the model Practice 00 called BIG_MODEL — is now a
 *   LEGACY id. It still answers, but Anthropic no longer lists it as current.
 *   The current mid-tier is `claude-sonnet-5-5` ($2 / $10 per million tokens).
 *
 *   Do not point this loop at it in a classroom. Every step re-sends the whole
 *   transcript, so the per-token price is multiplied by the number of steps
 *   AND by the growing context — twenty students running twelve-step loops on
 *   a model costing twice as much adds up fast, for a fix Haiku handles fine.
 *
 *   The lesson, again, is not "always use Haiku". It is that a model id you
 *   depend on turns legacy within a year, so it belongs in one place.
 */
export const MODEL_NOTES = {
  pricing: "$1 / $5 per million tokens (input / output)",
  currentMidTier: "claude-sonnet-5-5",
  legacy: ["claude-sonnet-5", "claude-opus-5"],
} as const;

/**
 * Pull the plain text out of a response.
 *
 * A response's `content` is an array of blocks, and not every block is text —
 * in this lab most turns are mostly `tool_use` blocks. Indexing
 * `content[0].text` blindly would crash on the first tool call, so we filter
 * by type instead.
 */
export function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/** What one call cost, in dollars, from its usage and the PRICING table. */
export function costOf(model: string, usage: Anthropic.Usage): number {
  const price = PRICING[model];
  if (!price) return 0;
  return (usage.input_tokens * price.input + usage.output_tokens * price.output) / 1_000_000;
}
