import { open, opendir, realpath } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import * as studentSchema from "../student/01-reader-schema.js";
import * as referenceSchema from "../reference/01-reader-schema.js";
import { pathBoundary as studentBoundary } from "../student/02-path-boundary.js";
import { pathBoundary as referenceBoundary } from "../reference/02-path-boundary.js";
import { decodeUtf8Prefix, FILE_BYTE_LIMIT, resolveInRoot, UUID_PATTERN } from "./guards.js";
import { ReportStore, type TestReport } from "./reports.js";
import { runCommand, SUITES, type Suite } from "./runner.js";
import { fail, ok, type Result } from "./result.js";

export type LabVariant = "starter" | "reference";
export type WorkspaceOptions = { root?: string; workRoot?: string; variant?: LabVariant };
export type FileValue = {
  path: string; content: string; returnedBytes: number; totalBytes: number;
  truncated: boolean; encoding: "utf-8";
};

export class Workspace {
  private running = false;
  private executionAttempts = 0;
  readonly reports: ReportStore;
  private constructor(readonly root: string, readonly variant: LabVariant, workRoot: string) {
    this.reports = new ReportStore(path.join(workRoot, "reports"));
  }

  static async create(options: WorkspaceOptions = {}): Promise<Workspace> {
    const configuredVariant = options.variant ?? process.env.LAB_VARIANT ?? "starter";
    if (configuredVariant !== "starter" && configuredVariant !== "reference") {
      throw new Error("LAB_VARIANT must be starter or reference.");
    }
    const root = await realpath(options.root ?? fileURLToPath(new URL("../../fixture/", import.meta.url)));
    const workRoot = path.resolve(options.workRoot ?? fileURLToPath(new URL("../../work/", import.meta.url)));
    return new Workspace(root, configuredVariant, workRoot);
  }

  async readFile(input: { path: string }): Promise<Result<FileValue>> {
    const contract = this.variant === "reference" ? referenceSchema : studentSchema;
    const parsed = contract.readerInputSchema.safeParse(input);
    if (!parsed.success) return fail("INVALID_INPUT", "read_file requires exactly one non-empty relative path of at most 240 characters.");
    if (!contract.readerContractComplete) return fail("NOT_IMPLEMENTED", "Complete TODO 1: implement the reader schema and description.");
    const boundary = this.variant === "reference" ? referenceBoundary : studentBoundary;
    const resolved = await resolveInRoot(this.root, parsed.data.path, "file", boundary);
    if (!resolved.ok) return resolved;
    try {
      const handle = await open(resolved.value.absolute, "r");
      try {
        const info = await handle.stat();
        if (!info.isFile()) return fail("NOT_A_FILE", "Only regular files may be read.");
        // Do not read a whole large file and cap it afterwards. One bounded read
        // obtains a prefix; fstat obtains size without acquiring the contents.
        const buffer = Buffer.alloc(FILE_BYTE_LIMIT);
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
        const truncated = info.size > bytesRead;
        const decoded = decodeUtf8Prefix(buffer.subarray(0, bytesRead), FILE_BYTE_LIMIT, truncated);
        if (!decoded.ok) return decoded;
        return ok({
          path: resolved.value.relative,
          content: decoded.value,
          returnedBytes: Buffer.byteLength(decoded.value),
          totalBytes: info.size,
          truncated,
          encoding: "utf-8",
        });
      } finally { await handle.close(); }
    } catch { return fail("IO_ERROR", "The fixture file could not be read."); }
  }

  async listFiles(input: { directory?: string; limit?: number } = {}): Promise<Result<{ files: string[]; truncated: boolean; scannedEntries: number }>> {
    if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some((key) => key !== "directory" && key !== "limit")) {
      return fail("INVALID_INPUT", "list_files accepts only directory and limit fields.");
    }
    const directory = input.directory ?? ".";
    const limit = input.limit ?? 30;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || typeof directory !== "string") {
      return fail("INVALID_INPUT", "directory must be a relative path; limit must be an integer from 1 to 100.");
    }
    const resolved = await resolveInRoot(this.root, directory, "directory");
    if (!resolved.ok) return resolved;
    const pending = [{ absolute: resolved.value.absolute, depth: 0 }];
    const files: string[] = [];
    let scannedEntries = 0;
    let truncated = false;
    try {
      while (pending.length > 0 && files.length < limit && scannedEntries < 1_000) {
        const current = pending.shift()!;
        // opendir streams entries; readdir would materialise an unbounded directory.
        const stream = await opendir(current.absolute);
        for await (const entry of stream) {
          scannedEntries += 1;
          const absolute = path.join(current.absolute, entry.name);
          if (entry.isFile()) files.push(path.relative(this.root, absolute).split(path.sep).join("/"));
          else if (entry.isDirectory()) {
            if (current.depth < 8) pending.push({ absolute, depth: current.depth + 1 });
            else truncated = true;
          }
          // Never follow a listed symlink; read_file independently verifies targets.
          if (files.length >= limit || scannedEntries >= 1_000) { truncated = true; break; }
        }
      }
      return ok({ files: files.sort(), truncated: truncated || pending.length > 0, scannedEntries });
    } catch { return fail("IO_ERROR", "The fixture directory could not be listed."); }
  }

  async runTests(input: { suite: string }): Promise<Result<TestReport>> {
    if (!input || !SUITES.includes(input.suite as Suite) || Object.keys(input).some((key) => key !== "suite")) {
      return fail("INVALID_INPUT", "suite must be exactly tokenizer, parser, or all.");
    }
    if (this.running) return fail("BUSY", "One test job is already running. Retry after it completes.", true);
    this.running = true;
    try {
      const suite = input.suite as Suite;
      const runId = randomUUID();
      const startedAt = new Date().toISOString();
      const files = suite === "all" ? ["tokenizer.test.ts", "parser.test.ts"] : [`${suite}.test.ts`];
      // Fixed argv, executable, loader, and trusted fixture. No command-string tool.
      const args = ["--import", import.meta.resolve("tsx"), "--test", "--test-reporter=tap", ...files.map((name) => path.join(this.root, "test", name))];
      const outcome = await runCommand(process.execPath, args, {
        cwd: this.root,
        onBeforeSpawn: () => { this.executionAttempts += 1; },
      });
      const report: TestReport = { runId, suite, startedAt, completedAt: new Date().toISOString(), ...outcome };
      const stored = await this.reports.save(report);
      if (!stored.ok) return stored;
      if (outcome.status === "timeout") return fail("TIMEOUT", `The test process group was terminated after 10 seconds; report ${runId} was stored.`, true);
      if (outcome.status === "error") return fail("PROCESS_ERROR", `The test process could not be launched; report ${runId} was stored.`, true);
      // A failing test is an executed operation with a failed test status.
      return ok(report);
    } finally { this.running = false; }
  }

  async getTestReport(input: { runId: string }): Promise<Result<TestReport>> {
    return this.reports.get(input?.runId);
  }

  async compareTestRuns(input: { beforeRunId: string; afterRunId: string }): Promise<Result> {
    if (!input || !UUID_PATTERN.test(input.beforeRunId) || !UUID_PATTERN.test(input.afterRunId)) return fail("INVALID_INPUT", "Both run IDs must be generated UUID v4 values.");
    const before = await this.reports.get(input.beforeRunId);
    if (!before.ok) return before;
    const after = await this.reports.get(input.afterRunId);
    if (!after.ok) return after;
    return ok({
      beforeRunId: input.beforeRunId, afterRunId: input.afterRunId,
      beforeStatus: before.value.status, afterStatus: after.value.status,
      resolvedTests: before.value.failedTests.filter((name) => !after.value.failedTests.includes(name)),
      newFailures: after.value.failedTests.filter((name) => !before.value.failedTests.includes(name)),
      remainingFailures: after.value.failedTests.filter((name) => before.value.failedTests.includes(name)),
    });
  }

  manifest() {
    return {
      name: "Practice 02 expression workspace", variant: this.variant,
      permittedRoot: "fixture/", suites: SUITES,
      expectedFailure: "tokenizer normalises CRLF line endings",
      ticket: "LAB-101", limits: { fileReturnedBytes: FILE_BYTE_LIMIT, processOutputBytes: 20_000, timeoutMs: 10_000, concurrency: 1, reports: 20 },
      observation: { executionAttempts: this.executionAttempts, meaning: "Session-local count incremented immediately before spawn; not an OS-level execution trace." },
      trust: "The fixture is trusted supplied code. Paths and external ticket text are untrusted inputs. The path check assumes no concurrent actor replaces fixture entries.",
    };
  }
}
