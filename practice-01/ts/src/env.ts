/**
 * Loads the shared .env — import this before reading process.env anywhere.
 *
 * There is ONE key file for the whole practice, at practice-01/.env, because
 * the Java track next door reads the same file. npm scripts run with the cwd
 * set to practice-01/ts, so from here the key lives one directory up.
 *
 * A variable already exported in your shell wins: dotenv never overwrites
 * something that is already set.
 *
 * This is deliberately separate from client.ts. client.ts exits the process
 * when the key is missing, which is right for the agent loop and wrong for
 * the setup check — the check needs to survive a missing key so it can tell
 * you how to fix it.
 */
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/** practice-01/ts — the npm project root. */
export const TS_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** practice-01 — where .env, .env.example and agent-anatomy.md live. */
export const PRACTICE_ROOT = join(TS_ROOT, "..");

/**
 * practice-01/parser-ts — the project the agent works ON.
 *
 * The agent loop lives here, in ts/, and reaches over into parser-ts/ through
 * its tools. Every file path a tool accepts is resolved relative to this
 * directory and refused if it leads outside it (see tools.ts).
 */
export const TARGET_ROOT = join(PRACTICE_ROOT, "parser-ts");

/** Absolute path of the .env we read. Printed by the setup check. */
export const ENV_PATH = join(PRACTICE_ROOT, ".env");

// quiet: dotenv v17 otherwise prints its own banner above the lab's output,
// which is confusing when the whole point of a slide is "read this output".
loadEnv({ path: ENV_PATH, quiet: true });
