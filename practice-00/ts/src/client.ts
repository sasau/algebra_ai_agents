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
