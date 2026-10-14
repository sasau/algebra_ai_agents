import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, symlink, rm, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { Workspace } from "../src/core/workspace.js";
import { runCommand } from "../src/core/runner.js";
import { ReportStore, REPORT_LIMIT, type TestReport } from "../src/core/reports.js";
import { createWorkspaceServer } from "../src/servers/workspace.js";
import { readerContractComplete } from "../src/student/01-reader-schema.js";

const fixture = fileURLToPath(new URL("../fixture/", import.meta.url));
async function temporary(t: { after: (fn: () => Promise<void>) => void }): Promise<string> {
  const directory = await mkdtemp(path.join(os.tmpdir(), "practice-02-workspace-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}
function value<T>(result: import("../src/core/result.js").Result<T>): T {
  if (!result.ok) assert.fail(JSON.stringify(result));
  return result.value;
}
function code(result: import("../src/core/result.js").Result): string {
  assert.equal(result.ok, false, JSON.stringify(result));
  if (result.ok) throw new Error("Expected refusal");
  return result.error.code;
}

test("starter reader is safely incomplete until implemented; reference continues after a missing file", async (t) => {
  const workRoot = await temporary(t);
  const starter = await Workspace.create({ variant: "starter", workRoot });
  const studentRead = await starter.readFile({ path: "src/tokenizer.ts" });
  if (!readerContractComplete) assert.equal(code(studentRead), "NOT_IMPLEMENTED");
  else assert.match(value(studentRead).content, /function tokenize/);
  const workspace = await Workspace.create({ variant: "reference", workRoot });
  assert.equal(code(await workspace.readFile({ path: "does-not-exist.ts" })), "NOT_FOUND");
  const read = value(await workspace.readFile({ path: "src/tokenizer.ts" }));
  assert.match(read.content, /function tokenize/);
  assert.equal(read.returnedBytes, Buffer.byteLength(read.content));
  assert.equal(read.truncated, false);
});

test("reader refuses parent, similarly prefixed sibling, external symlink, absolute path, and directory", async (t) => {
  const parent = await temporary(t);
  const root = path.join(parent, "fixture"); const sibling = path.join(parent, "fixture-private");
  await mkdir(root); await mkdir(sibling);
  await writeFile(path.join(sibling, "CANARY.txt"), "LAB_SYNTHETIC_CANARY");
  await writeFile(path.join(parent, "CANARY.txt"), "LAB_SYNTHETIC_CANARY");
  await symlink(path.join(sibling, "CANARY.txt"), path.join(root, "linked-canary.txt"));
  const workspace = await Workspace.create({ root, variant: "reference", workRoot: path.join(parent, "work") });
  for (const requested of ["../CANARY.txt", "../fixture-private/CANARY.txt", "linked-canary.txt", path.join(sibling, "CANARY.txt")]) {
    const refusal = await workspace.readFile({ path: requested });
    assert.equal(code(refusal), "PATH_DENIED", requested);
    assert.equal(JSON.stringify(refusal).includes("LAB_SYNTHETIC_CANARY"), false);
  }
  assert.equal(code(await workspace.readFile({ path: "." })), "NOT_A_FILE");
});

test("reader bounds acquisition and preserves a multibyte UTF-8 boundary", async (t) => {
  const parent = await temporary(t);
  await writeFile(path.join(parent, "large.txt"), "a".repeat(19_999) + "🙂".repeat(100_000));
  await writeFile(path.join(parent, "invalid.txt"), Buffer.from([0xff, 0xfe]));
  const workspace = await Workspace.create({ root: parent, variant: "reference", workRoot: path.join(parent, "work") });
  const read = value(await workspace.readFile({ path: "large.txt" }));
  assert.equal(read.returnedBytes, 19_999);
  assert.equal(read.truncated, true);
  assert.equal(read.content.includes("�"), false);
  assert.equal(code(await workspace.readFile({ path: "invalid.txt" })), "INVALID_ENCODING");
});

test("list validates its bounds and never follows external symlinks", async (t) => {
  const parent = await temporary(t); const root = path.join(parent, "fixture");
  await mkdir(root); await writeFile(path.join(root, "first.txt"), "one");
  await mkdir(path.join(parent, "outside")); await writeFile(path.join(parent, "outside", "secret.txt"), "synthetic");
  await symlink(path.join(parent, "outside"), path.join(root, "link"));
  const workspace = await Workspace.create({ root, variant: "reference", workRoot: path.join(parent, "work") });
  assert.equal(code(await workspace.listFiles({ limit: 101 })), "INVALID_INPUT");
  assert.deepEqual(value(await workspace.listFiles()).files, ["first.txt"]);
});

test("fixed suites reject command text before creating reports; one seeded test fails", async (t) => {
  const workRoot = await temporary(t);
  const workspace = await Workspace.create({ variant: "reference", workRoot });
  assert.equal(workspace.manifest().observation.executionAttempts, 0);
  assert.equal(code(await workspace.runTests({ suite: "all; echo LAB_CANARY" })), "INVALID_INPUT");
  assert.equal(workspace.manifest().observation.executionAttempts, 0);
  const running = workspace.runTests({ suite: "all" });
  assert.equal(code(await workspace.runTests({ suite: "parser" })), "BUSY");
  const report = value(await running);
  assert.equal(workspace.manifest().observation.executionAttempts, 1);
  assert.equal(report.status, "failed");
  assert.equal(report.exitCode, 1);
  assert.deepEqual(report.failedTests, ["tokenizer normalises CRLF line endings"]);
  const parser = value(await workspace.runTests({ suite: "parser" }));
  assert.equal(workspace.manifest().observation.executionAttempts, 2);
  assert.equal(parser.status, "passed");
  assert.deepEqual(parser.failedTests, []);
  const restarted = await Workspace.create({ variant: "reference", workRoot });
  assert.deepEqual(value(await restarted.getTestReport({ runId: report.runId })), report);
  assert.equal(code(await workspace.getTestReport({ runId: "../../outside" })), "INVALID_INPUT");
  const compared = value(await workspace.compareTestRuns({ beforeRunId: report.runId, afterRunId: parser.runId })) as { resolvedTests: string[] };
  assert.deepEqual(compared.resolvedTests, ["tokenizer normalises CRLF line endings"]);
  assert.equal((await readdir(path.join(workRoot, "reports"))).length, 2);
});

test("durable report store retains the last twenty generated IDs", async (t) => {
  const root = await temporary(t); const store = new ReportStore(root);
  const ids: string[] = [];
  for (let index = 0; index < REPORT_LIMIT + 1; index += 1) {
    const runId = randomUUID(); ids.push(runId);
    const report: TestReport = {
      runId, suite: "parser", startedAt: new Date(index * 1_000).toISOString(), completedAt: new Date(index * 1_000).toISOString(),
      status: "passed", exitCode: 0, durationMs: 1, output: "ok", outputBytes: 2, retainedBytes: 2, truncated: false, failedTests: [],
    };
    value(await store.save(report));
  }
  assert.equal((await readdir(root)).length, REPORT_LIMIT);
  assert.equal(code(await store.get(ids[0]!)), "NOT_FOUND");
  assert.equal(value(await store.get(ids.at(-1)!)).runId, ids.at(-1));
});

test("report lookup refuses oversized files and corrupted failing-test fields", async (t) => {
  const root = await temporary(t); const store = new ReportStore(root);
  const oversizedId = randomUUID(); const malformedId = randomUUID();
  await writeFile(path.join(root, `${oversizedId}.json`), " ".repeat(1_000_000));
  await writeFile(path.join(root, `${malformedId}.json`), JSON.stringify({ runId: malformedId, status: "failed", output: "", failedTests: [123] }));
  assert.equal(code(await store.get(oversizedId)), "INVALID_REPORT");
  assert.equal(code(await store.get(malformedId)), "INVALID_REPORT");
});

test("runner drains excess output, terminates and reaps a TERM-resistant descendant", { skip: process.platform === "win32" }, async () => {
  const source = fileURLToPath(new URL("../exercises/attacks/noisy-worker.ts", import.meta.url));
  const outcome = await runCommand(process.execPath, ["--import", import.meta.resolve("tsx"), source], { cwd: fixture, timeoutMs: 600 });
  assert.equal(outcome.status, "timeout");
  assert.equal(outcome.truncated, true);
  assert.equal(outcome.retainedBytes <= 20_000, true);
  assert.equal(outcome.outputBytes > 20_000, true);
  assert.equal(outcome.durationMs < 3_000, true);
  const pid = Number(outcome.output.match(/DESCENDANT_PID=(\d+)/)?.[1]);
  assert.equal(Number.isInteger(pid) && pid > 0, true);
  // SIGKILL and orphan reaping can be asynchronous; verify independent OS state.
  let disappeared = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { process.kill(pid, 0); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ESRCH") { disappeared = true; break; } throw error; }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.equal(disappeared, true, `Descendant ${pid} survived the process-group timeout`);
});

test("real MCP discovery exposes five tools, resources, prompt, and a shared reader result", async (t) => {
  const workRoot = await temporary(t);
  const server = await createWorkspaceServer({ variant: "reference", workRoot });
  const client = new Client({ name: "workspace-test", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport); await client.connect(clientTransport);
  t.after(async () => { await client.close(); await server.close(); });
  assert.deepEqual((await client.listTools()).tools.map((tool) => tool.name).sort(), ["compare_test_runs", "get_test_report", "list_files", "read_file", "run_tests"]);
  assert.equal((await client.listResources()).resources[0]?.uri, "workspace://manifest");
  assert.equal((await client.listResourceTemplates()).resourceTemplates[0]?.uriTemplate, "workspace://reports/{runId}");
  assert.equal((await client.listPrompts()).prompts[0]?.name, "diagnose_test_failure");
  const read = await client.callTool({ name: "read_file", arguments: { path: "src/tokenizer.ts" } });
  assert.equal(read.isError, undefined);
  assert.equal((read.structuredContent as { ok: boolean }).ok, true);
  const missing = await client.callTool({ name: "read_file", arguments: { path: "absent" } });
  assert.equal(missing.isError, true);
  assert.equal((missing.structuredContent as { error: { code: string } }).error.code, "NOT_FOUND");
  const invalid = await client.callTool({ name: "run_tests", arguments: { suite: "all; echo LAB_CANARY" } });
  assert.equal(invalid.isError, true);
  assert.equal((await client.readResource({ uri: "workspace://manifest" })).contents[0]?.mimeType, "application/json");
  assert.match((await client.getPrompt({ name: "diagnose_test_failure" })).messages[0]!.content.type, /text/);
});
