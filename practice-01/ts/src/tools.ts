/**
 * The agent's tools — part 3 of the five parts (goal · model · TOOLS · memory ·
 * stopping condition).
 *
 * A tool is two things that must agree:
 *
 *   1. a DECLARATION the model reads — name, description, JSON schema of the
 *      input. This is sent with every API call. It is a prompt: the model
 *      decides whether and how to call a tool from these words alone, so each
 *      description below is written FOR THE MODEL, not for you.
 *   2. an IMPLEMENTATION your code runs when the model asks — the model never
 *      touches a file or a shell itself; it emits `{ name, input }` and waits.
 *
 * Everything here is jailed to TARGET_ROOT (practice-01/parser-ts). The model
 * is given three verbs and one directory; that is the whole of what it can do
 * to the world, whatever it decides to try.
 *
 * Tool implementations never throw. A failure is reported back to the model
 * as a tool_result with `is_error: true`, because a model that is TOLD its
 * path was wrong can correct it on the next step — a crashed loop cannot.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { TARGET_ROOT } from "./env.js";

/** What an implementation hands back; becomes the `tool_result` block. */
export interface ToolOutcome {
  content: string;
  is_error?: boolean;
}

/** Files larger than this are truncated — a parser project has none, a `node_modules` mistake does. */
const READ_CAP_BYTES = 20 * 1024;

/** How many trailing lines of a test run the model gets to see. */
const TEST_TAIL_LINES = 40;

// ── 1. declarations — what the model reads ──────────────────────────────────

export const TOOLS: Anthropic.Tool[] = [
  {
    name: "read_file",
    description:
      "Read a UTF-8 text file from the project. `path` is relative to the project root, " +
      "for example `src/parser.ts` or `test/parser.test.ts`. Returns the file's contents. " +
      "Files larger than 20 KB are truncated.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Project-relative path of the file to read." },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description:
      "Replace the contents of a file in the project with `content` (the complete new file, " +
      "not a diff). `path` is relative to the project root, for example `src/parser.ts`. " +
      "Files under `test/` cannot be written. Returns a confirmation with the byte count.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Project-relative path of the file to write." },
        content: { type: "string", description: "The complete new contents of the file." },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "run_tests",
    description:
      "Run the project's test suite (`npm test`). Takes no input. Returns the exit code " +
      "(0 means every test passed) followed by the last 40 lines of output, which name " +
      "any failing test and the error it raised.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// ── 2. implementations — what your code runs ────────────────────────────────

/**
 * Resolves a model-supplied path inside the jail, or explains why it cannot.
 *
 * Three refusals, each a different escape route: an absolute path ignores the
 * root entirely; a `..` segment climbs out of it; and `relative()` is the
 * belt-and-braces check that whatever `resolve()` produced really is below
 * TARGET_ROOT. (Symlinks are not followed and not checked — the target is a
 * plain checkout; a production harness would `realpath` here too.)
 */
function jail(path: string): { ok: true; abs: string; rel: string } | { ok: false; error: string } {
  if (path.trim() === "") return { ok: false, error: "path must not be empty" };
  if (isAbsolute(path)) {
    return { ok: false, error: `absolute paths are not allowed: ${path} — use a path relative to the project root` };
  }
  if (path.split(/[\\/]/).includes("..")) {
    return { ok: false, error: `paths may not contain '..': ${path}` };
  }
  const abs = resolve(TARGET_ROOT, path);
  const rel = relative(TARGET_ROOT, abs);
  if (rel === "" || rel.startsWith("..") || isAbsolute(rel)) {
    return { ok: false, error: `path escapes the project: ${path}` };
  }
  return { ok: true, abs, rel };
}

function readFile(path: string): ToolOutcome {
  const j = jail(path);
  if (!j.ok) return { content: j.error, is_error: true };
  if (!existsSync(j.abs)) return { content: `no such file: ${path}`, is_error: true };
  if (statSync(j.abs).isDirectory()) return { content: `${path} is a directory, not a file`, is_error: true };

  const buf = readFileSync(j.abs);
  if (buf.length <= READ_CAP_BYTES) return { content: buf.toString("utf8") };
  return {
    content:
      buf.subarray(0, READ_CAP_BYTES).toString("utf8") +
      `\n… [truncated: showing ${READ_CAP_BYTES} of ${buf.length} bytes]`,
  };
}

/**
 * The goal says "do not edit anything under test/". Saying so is the prompt
 * half of Rule 2; THIS is the harness half: even if the model decides to make
 * the failing test pass by changing the test, the tool refuses, and the model
 * reads the refusal. A constraint the harness enforces holds whatever the
 * model decides; a constraint only the prompt states holds until it does not.
 *
 * Note what this does NOT guard: package.json, vitest.config.ts, or deleting
 * a test by other means. That is why the loop verifies from outside afterwards
 * and prints `git diff --stat` — Rule 5 catches what Rule 2 did not foresee.
 */
function writeFile(path: string, content: string): ToolOutcome {
  const j = jail(path);
  if (!j.ok) return { content: j.error, is_error: true };

  const top = j.rel.split(sep)[0];
  if (top === "test") {
    return {
      content: `refused: ${path} is under test/ — tests are read-only in this project; fix the source instead`,
      is_error: true,
    };
  }

  mkdirSync(dirname(j.abs), { recursive: true });
  writeFileSync(j.abs, content, "utf8");
  return { content: `ok, ${Buffer.byteLength(content, "utf8")} bytes written to ${path}` };
}

/**
 * Runs `npm test` in the target and returns what a developer would read.
 *
 * A failing test suite is NOT a tool error — it is the observation the whole
 * loop exists to produce, so `is_error` stays unset and the exit code is in
 * the text. `is_error` is only for "npm could not even start".
 *
 * `shell: true` on Windows because `npm` is `npm.cmd` there and spawnSync
 * cannot launch a .cmd file directly.
 */
function runTests(): ToolOutcome {
  const run = spawnSync("npm", ["test"], {
    cwd: TARGET_ROOT,
    encoding: "utf8",
    timeout: 120_000,
    shell: process.platform === "win32",
  });

  if (run.status === null) {
    const why = run.error?.message ?? (run.signal ? `killed by ${run.signal}` : "unknown reason");
    return { content: `could not run npm test in ${TARGET_ROOT}: ${why}`, is_error: true };
  }

  const tail = `${run.stdout}\n${run.stderr}`
    .split("\n")
    .filter((line) => line.trim() !== "")
    .slice(-TEST_TAIL_LINES)
    .join("\n");
  return { content: `exit code: ${run.status}\n\n${tail}` };
}

// ── 3. dispatch — from the model's `{ name, input }` to a result ────────────

/** Reads a string field off an `unknown` input without pretending to know its shape. */
function stringField(input: unknown, key: string): string | undefined {
  if (typeof input !== "object" || input === null) return undefined;
  const value = (input as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

/**
 * Runs the tool the model named with the input it supplied.
 *
 * The input arrives as `unknown` because it came from the model, not from
 * your code — the schema above asks for strings, but the harness checks
 * rather than trusts, and reports a bad call back as an error the model can
 * read and fix.
 */
export function runTool(name: string, input: unknown): ToolOutcome {
  switch (name) {
    case "read_file": {
      const path = stringField(input, "path");
      if (path === undefined) return { content: "read_file needs a string `path`", is_error: true };
      return readFile(path);
    }
    case "write_file": {
      const path = stringField(input, "path");
      const content = stringField(input, "content");
      if (path === undefined || content === undefined) {
        return { content: "write_file needs a string `path` and a string `content`", is_error: true };
      }
      return writeFile(path, content);
    }
    case "run_tests":
      return runTests();
    default:
      return { content: `unknown tool: ${name}`, is_error: true };
  }
}
