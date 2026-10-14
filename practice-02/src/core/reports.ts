import { mkdir, open, opendir, rename, unlink, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { UUID_PATTERN } from "./guards.js";
import { fail, ok, type Result } from "./result.js";
import type { ProcessOutcome, Suite } from "./runner.js";

export const REPORT_LIMIT = 20;
export const REPORT_BYTE_LIMIT = 32_000;
export type TestReport = ProcessOutcome & {
  runId: string;
  suite: Suite;
  startedAt: string;
  completedAt: string;
};

const reportSchema = z.object({
  runId: z.string().regex(UUID_PATTERN), suite: z.enum(["tokenizer", "parser", "all"]),
  startedAt: z.iso.datetime(), completedAt: z.iso.datetime(),
  status: z.enum(["passed", "failed", "timeout", "error"]),
  exitCode: z.number().int().min(0).max(255).nullable(), durationMs: z.number().int().nonnegative(),
  output: z.string(), outputBytes: z.number().int().nonnegative(), retainedBytes: z.number().int().min(0).max(20_000),
  truncated: z.boolean(), failedTests: z.array(z.string().max(240)).max(20),
}).strict();

export class ReportStore {
  constructor(readonly directory: string) {}

  async save(report: TestReport): Promise<Result<TestReport>> {
    try {
      await mkdir(this.directory, { recursive: true, mode: 0o700 });
      if (!reportSchema.safeParse(report).success || Buffer.byteLength(report.output) > 20_000) {
        return fail("INVALID_REPORT", "The report does not match the bounded run-report contract.");
      }
      const serialised = JSON.stringify(report);
      if (Buffer.byteLength(serialised) > REPORT_BYTE_LIMIT) return fail("RESULT_TOO_LARGE", "The run report exceeded its storage budget.");
      const destination = path.join(this.directory, `${report.runId}.json`);
      const temporary = path.join(this.directory, `${report.runId}.tmp`);
      await writeFile(temporary, serialised, { flag: "wx", mode: 0o600 });
      await rename(temporary, destination);
      await this.prune();
      return ok(report);
    } catch { return fail("REPORT_IO_ERROR", "The run completed, but its report could not be stored.", true); }
  }

  async get(runId: string): Promise<Result<TestReport>> {
    if (typeof runId !== "string" || !UUID_PATTERN.test(runId)) return fail("INVALID_INPUT", "runId must be a generated UUID v4.");
    try {
      // The key is validated; callers never provide a storage path.
      const loaded = await this.load(path.join(this.directory, `${runId}.json`));
      if (!loaded.ok) return loaded;
      if (loaded.value.runId !== runId) return fail("INVALID_REPORT", "The stored report ID does not match the lookup key.");
      return loaded;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return fail("NOT_FOUND", "The report is absent or has expired from the last-20-run store.");
      return fail("REPORT_IO_ERROR", "The stored report could not be read.", true);
    }
  }

  private async prune(): Promise<void> {
    // Stream directory entries and retain at most 20 ordering records in memory.
    // The local store is owned by one workspace process; no hostile concurrent writer.
    const entries = await opendir(this.directory);
    const retained: { name: string; time: string; runId: string }[] = [];
    let inspected = 0;
    for await (const entry of entries) {
      inspected += 1;
      if (inspected > 1_000) throw new Error("Report directory contains excessive unrelated entries.");
      if (!entry.isFile() || !entry.name.endsWith(".json") || !UUID_PATTERN.test(entry.name.slice(0, -5))) continue;
      const loaded = await this.load(path.join(this.directory, entry.name));
      if (!loaded.ok) throw new Error("Report directory contains an invalid report.");
      retained.push({ name: entry.name, time: loaded.value.completedAt, runId: loaded.value.runId });
      retained.sort((a, b) => b.time.localeCompare(a.time) || b.runId.localeCompare(a.runId));
      if (retained.length > REPORT_LIMIT) await unlink(path.join(this.directory, retained.pop()!.name));
    }
  }

  private async load(filename: string): Promise<Result<TestReport>> {
    const handle = await open(filename, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
      const info = await handle.stat();
      if (!info.isFile() || info.size > REPORT_BYTE_LIMIT) return fail("INVALID_REPORT", "The stored report is not a bounded regular file.");
      const buffer = Buffer.alloc(REPORT_BYTE_LIMIT + 1);
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
      if (bytesRead > REPORT_BYTE_LIMIT) return fail("INVALID_REPORT", "The stored report exceeded its storage budget.");
      let decoded: unknown;
      try { decoded = JSON.parse(buffer.subarray(0, bytesRead).toString("utf8")); }
      catch { return fail("INVALID_REPORT", "The stored report does not contain valid JSON."); }
      const parsed = reportSchema.safeParse(decoded);
      if (!parsed.success || Buffer.byteLength(parsed.data.output) > 20_000 || Buffer.byteLength(parsed.data.output) !== parsed.data.retainedBytes) {
        return fail("INVALID_REPORT", "The stored report does not match the bounded run-report contract.");
      }
      return ok(parsed.data);
    } finally { await handle.close(); }
  }
}
