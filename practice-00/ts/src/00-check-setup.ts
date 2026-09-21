/**
 * 00-check-setup.ts — run this FIRST.
 *
 *     npm run check
 *
 * Verifies, in order, that: Node is new enough, the SDK is installed, a key is
 * present and well-formed, and the API actually answers you. Each check either
 * passes or tells you exactly what to do about it.
 *
 * If this script prints "ALL CHECKS PASSED", every other exercise will run.
 */
import { ENV_PATH, PRACTICE_ROOT, TS_ROOT } from "./env.js";
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

console.log("\nPractice 00 — environment check · TypeScript track\n");

// --- 1. Node version ------------------------------------------------------
// The course targets Node 20 LTS. Older versions lack the fetch and ESM
// behaviour the SDK relies on.
const major = Number(process.versions.node.split(".")[0]);
if (major >= 20) {
  pass("Node version", `v${process.versions.node}`);
} else {
  fail(
    `Node version v${process.versions.node} is too old`,
    "install Node 20 LTS or newer from https://nodejs.org",
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

// --- 5. A real round-trip to the API -------------------------------------
// Everything above is local. This is the only check that proves the key works,
// the network is reachable, and your account has credit. We ask for 5 tokens
// so it costs essentially nothing.
if (failures === 0) {
  console.log("\n  … calling the API (this costs a fraction of a cent) …\n");
  try {
    const { client, MODEL } = await import("./client.js");
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 5,
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
    });
    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("")
      .trim();
    pass("API round-trip", `model replied "${text}"`);
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
  console.log("  ALL CHECKS PASSED — you are ready. Start with: npm run ex1\n");
  process.exit(0);
} else {
  console.log(`  ${failures} check(s) failed. Fix them above, then run npm run check again.\n`);
  process.exit(1);
}
