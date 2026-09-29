/**
 * Shared setup for every exercise in this practice.
 *
 * Import `client` and the model constants from here instead of constructing
 * an Anthropic client in each file — when a model is renamed, this is the
 * only file that changes.
 */
import "./env.js"; // loads practice-00/.env before anything reads process.env
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
      "  Fix it one of two ways, from the practice-00 folder:",
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
 * The model we use for most of this lab.
 *
 * Haiku 4.5 is the cheapest current model ($1/$5 per million tokens) and it is
 * fast, which matters when twenty students hit the API at once. It is also the
 * only current model that still accepts `temperature` — see MODEL_NOTES below.
 */
export const MODEL = "claude-haiku-4-5";

/**
 * A frontier model, for the one exercise where we compare answer quality.
 * Costs ~2x Haiku on input. Do not use it in a loop.
 */
export const BIG_MODEL = "claude-sonnet-5";

/**
 * The most capable model we touch — used once, in Exercise 7, to see what the
 * top of the range buys on the same prompt. Five times Haiku's price per
 * token, and it thinks by default, so it also spends MORE tokens per answer.
 */
export const OPUS_MODEL = "claude-opus-5";

/**
 * Price per million tokens, in dollars, for every model this lab calls.
 * Lives here for the same reason the ids do: one place to change it.
 *
 * Thinking tokens are billed as OUTPUT tokens — they are already inside
 * `usage.output_tokens`, which is why "try harder" is never free.
 */
export const PRICING: Record<string, { input: number; output: number }> = {
  [MODEL]: { input: 1, output: 5 },
  [BIG_MODEL]: { input: 2, output: 10 },
  [OPUS_MODEL]: { input: 5, output: 25 },
};

/**
 * Why the lab pins Haiku 4.5 rather than the newest model:
 *
 *   The `temperature`, `top_p` and `top_k` sampling parameters were REMOVED
 *   from the current frontier models. Sending a non-default `temperature` to
 *   claude-sonnet-5, claude-opus-5 or claude-opus-4-8 returns HTTP 400.
 *   Those models steer through prompting and `output_config.effort` instead.
 *
 *   Exercise 3 is about feeling what temperature does, so it needs a model
 *   that still has the knob. Haiku 4.5 does.
 *
 *   The lesson to take away is NOT "always use Haiku" — it is that a
 *   parameter you depend on can disappear in a model generation, so the
 *   model id and its capabilities belong in one place, not scattered across
 *   twenty call sites. That is exactly why this file exists.
 */
export const MODEL_NOTES = {
  supportsTemperature: true,
  pricing: "$1 / $5 per million tokens (input / output)",
} as const;

/**
 * Pull the plain text out of a response.
 *
 * A response's `content` is an array of blocks, and not every block is text
 * (tool calls and thinking blocks also live there). Indexing `content[0].text`
 * blindly works today and breaks the first time you add a tool — so we filter
 * by type instead. You will reuse this helper all term.
 */
export function textOf(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
}

/** Prints `usage` as a single readable line. */
export function reportUsage(label: string, usage: Anthropic.Usage): void {
  console.log(
    `   [${label}] in: ${usage.input_tokens} tok · out: ${usage.output_tokens} tok`,
  );
}

/**
 * The thinking text of a response — the "working" the model did before it
 * answered, or "" if it did not think (or the API was told to omit it).
 * Same filter-by-type idea as `textOf`, aimed at the other block kind.
 */
export function thinkingOf(message: Anthropic.Message): string {
  return message.content
    .filter((block): block is Anthropic.ThinkingBlock => block.type === "thinking")
    .map((block) => block.thinking)
    .join("");
}

/** How many of the billed output tokens were spent thinking (0 if none). */
export function thinkingTokensOf(usage: Anthropic.Usage): number {
  return usage.output_tokens_details?.thinking_tokens ?? 0;
}

/** What one call cost, in dollars, from its usage and the PRICING table. */
export function costOf(model: string, usage: Anthropic.Usage): number {
  const price = PRICING[model];
  if (!price) return 0;
  return (usage.input_tokens * price.input + usage.output_tokens * price.output) / 1_000_000;
}
