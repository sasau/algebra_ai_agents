/**
 * Loads the shared .env — import this before reading process.env anywhere.
 *
 * There is ONE key file for the whole practice, at practice-00/.env, because
 * the Java track next door reads the same file. npm scripts run with the cwd
 * set to practice-00/ts, so from here the key lives one directory up.
 *
 * A variable already exported in your shell wins: dotenv never overwrites
 * something that is already set.
 *
 * This is deliberately separate from client.ts. client.ts exits the process
 * when the key is missing, which is right for an exercise and wrong for the
 * setup check — the check needs to survive a missing key so it can tell you
 * how to fix it.
 */
import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/** practice-00/ts — the npm project root. */
export const TS_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** practice-00 — where .env, .env.example and findings.md live. */
export const PRACTICE_ROOT = join(TS_ROOT, "..");

/** Absolute path of the .env we read. Printed by the setup check. */
export const ENV_PATH = join(PRACTICE_ROOT, ".env");

// quiet: dotenv v17 otherwise prints its own banner above the lab's output,
// which is confusing when the whole point of a slide is "read this output".
loadEnv({ path: ENV_PATH, quiet: true });
