/**
 * 00-check-setup.ts — run this FIRST.
 *
 *     npm run check
 *
 * Verifies, in order, that: Node is new enough, the SDK is installed, a key is
 * present and well-formed, the target project is installed, git and Docker
 * are available, and the API actually answers you. Each check either passes
 * or tells you exactly what to do about it.
 *
 * If this script prints "ALL CHECKS PASSED", Act 2 will run.
 */
import { ENV_PATH, PRACTICE_ROOT, TARGET_ROOT, TS_ROOT } from "./env.js";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

let failures = 0;

function pass(label: string, detail = ""): void {
  console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ""}`);
}

function fail(label: string, fix: string): void {
  failures++;
  console.log(`  ✗ ${label}`);
  console.log(`      fix: ${fix}`);
}

/** Something to know about, not something that blocks you. */
function warn(label: string, note: string): void {
  console.log(`  ! ${label}`);
  console.log(`      note: ${note}`);
}

/** Runs `<cmd> --version` and returns its first output line, or undefined if it is not installed. */
function versionOf(cmd: string): string | undefined {
  const run = spawnSync(cmd, ["--version"], { encoding: "utf8", shell: process.platform === "win32" });
  if (run.status !== 0) return undefined;
  return run.stdout.trim().split("\n")[0];
}

console.log("\nPractice 01 — environment check · TypeScript track\n");

// --- 1. Node version ------------------------------------------------------
// The loop itself runs on Node 20 LTS. The TARGET project (parser-ts) uses
// vitest 5, which declares Node 22.12 or newer — so on Node 20 your own code
// runs, but `npm test` inside parser-ts may not. We say so rather than fail.
const [major = 0, minor = 0] = process.versions.node.split(".").map(Number);
if (major >= 20) {
  pass("Node version", `v${process.versions.node}`);
  if (major < 22 || (major === 22 && minor < 12)) {
    warn(
      "parser-ts needs Node 22.12+ for its test runner (vitest 5)",
      "if `npm test` in ../parser-ts refuses to start, install Node 22 LTS from https://nodejs.org",
    );
  }
} else {
  fail(
    `Node version v${process.versions.node} is too old`,
    "install Node 22 LTS from https://nodejs.org",
  );
}

// --- 2. Dependencies installed -------------------------------------------
if (existsSync(join(TS_ROOT, "node_modules", "@anthropic-ai", "sdk"))) {
  pass("Anthropic SDK installed");
} else {
  fail("Anthropic SDK not found in node_modules", "run: npm install");
}

// --- 3. The key is present and plausible ---------------------------------
// We check the shape, not the value — a typo'd key looks fine until the API
// rejects it, and "invalid x-api-key" is a much clearer error than a silent
// hang. We never print the key itself.
const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  fail(
    "ANTHROPIC_API_KEY is not set",
    `cd .. && cp .env.example .env, then put your key in ${ENV_PATH}`,
  );
} else if (key === "sk-ant-REPLACE-ME") {
  fail(
    "ANTHROPIC_API_KEY is still the placeholder",
    `open ${ENV_PATH} and replace sk-ant-REPLACE-ME with your real key`,
  );
} else if (!key.startsWith("sk-ant-")) {
  fail(
    "ANTHROPIC_API_KEY does not look like an Anthropic key",
    "keys start with 'sk-ant-' — check you copied the whole thing",
  );
} else {
  // Show only the last 4 characters, so you can tell two keys apart without
  // ever leaking one into a terminal recording or a screenshot.
  pass("ANTHROPIC_API_KEY present", `${key.length} chars, ends …${key.slice(-4)}`);
}

// --- 4. .env is ignored by git -------------------------------------------
// The single most expensive mistake in this repo is committing a key.
const gitignorePaths = [
  join(PRACTICE_ROOT, ".gitignore"),
  join(PRACTICE_ROOT, "..", ".gitignore"),
];
if (gitignorePaths.some((p) => existsSync(p))) {
  pass(".gitignore present", "your .env will not be committed");
} else {
  fail(
    "no .gitignore found",
    "do not commit anything until one exists — your key would go with it",
  );
}

// --- 5. The target project is installed ----------------------------------
// The agent's run_tests tool spawns `npm test` inside parser-ts. That needs
// parser-ts's own node_modules — a separate install from this folder's.
if (existsSync(join(TARGET_ROOT, "node_modules", "vitest"))) {
  pass("parser-ts installed", "node_modules present in ../parser-ts");
} else {
  fail("parser-ts has no node_modules — run_tests would fail", "cd ../parser-ts && npm install");
}

// --- 6. git ---------------------------------------------------------------
// The loop resets parser-ts/src with `git checkout` before each run and shows
// `git diff --stat` after it. Without git you can still run once, blind.
const gitVersion = versionOf("git");
if (gitVersion) {
  pass("git available", gitVersion);
} else {
  fail("git not found on PATH", "install git from https://git-scm.com/downloads");
}

// --- 7. Docker (Act 3 only) ----------------------------------------------
// Acts 1 and 2 do not need Docker. Act 3 runs the fully autonomous bot inside
// a container, so a missing Docker is a warning now and a blocker later.
const dockerVersion = versionOf("docker");
if (dockerVersion) {
  pass("Docker available", dockerVersion);
} else {
  warn(
    "Docker not found on PATH — Acts 1 and 2 run without it",
    "Act 3 needs it; install Docker Desktop from https://www.docker.com/products/docker-desktop before then",
  );
}

// --- 8. A real round-trip to the API -------------------------------------
// Everything above is local. This is the only check that proves the key works,
// the network is reachable, and your account has credit. We ask for 5 tokens
// so it costs essentially nothing.
if (failures === 0) {
  console.log("\n  … calling the API (this costs a fraction of a cent) …\n");
  try {
    const { client, MODEL, textOf } = await import("./client.js");
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 5,
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
    });
    pass("API round-trip", `model replied "${textOf(res).trim()}"`);
    pass(
      "token accounting",
      `in: ${res.usage.input_tokens}, out: ${res.usage.output_tokens}`,
    );
  } catch (err) {
    const e = err as { status?: number; message?: string };
    if (e.status === 401) {
      fail("API rejected the key (401)", "check the key in .env is correct and active");
    } else if (e.status === 429) {
      fail("rate limited (429)", "wait a moment and run npm run check again");
    } else if (e.status === 400 && /credit|balance/i.test(e.message ?? "")) {
      fail("account has no credit", "add credit at console.anthropic.com/settings/billing");
    } else {
      fail(`API call failed${e.status ? ` (${e.status})` : ""}`, e.message ?? String(err));
    }
  }
} else {
  console.log("\n  … skipping the API call until the checks above pass.\n");
}

// --- verdict --------------------------------------------------------------
console.log("");
if (failures === 0) {
  console.log("  ALL CHECKS PASSED — you are ready. Start with: npm run agent\n");
  process.exit(0);
} else {
  console.log(`  ${failures} check(s) failed. Fix them above, then run npm run check again.\n`);
  process.exit(1);
}
