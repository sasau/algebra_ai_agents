import { spawn, type ChildProcess } from "node:child_process";
import { performance } from "node:perf_hooks";
import { decodeUtf8Prefix } from "./guards.js";

export const PROCESS_TIMEOUT_MS = 10_000;
export const PROCESS_OUTPUT_LIMIT = 20_000;
export const SUITES = ["tokenizer", "parser", "all"] as const;
export type Suite = typeof SUITES[number];
export type ProcessOutcome = {
  status: "passed" | "failed" | "timeout" | "error";
  exitCode: number | null;
  durationMs: number;
  output: string;
  outputBytes: number;
  retainedBytes: number;
  truncated: boolean;
  failedTests: string[];
};

/** Test seam: not an MCP operation. Public callers can only choose SUITES. */
export async function runCommand(
  executable: string,
  args: readonly string[],
  options: { cwd: string; timeoutMs?: number; outputLimit?: number; onBeforeSpawn?: () => void },
): Promise<ProcessOutcome> {
  const started = performance.now();
  const timeoutMs = options.timeoutMs ?? PROCESS_TIMEOUT_MS;
  const outputLimit = options.outputLimit ?? PROCESS_OUTPUT_LIMIT;
  return new Promise((resolve) => {
    let retained = 0;
    let total = 0;
    const chunks: Buffer[] = [];
    let timedOut = false;
    let launchFailed = false;
    let killTimer: NodeJS.Timeout | undefined;
    // Read-only observation seam. The workspace increments a private counter here;
    // callers cannot configure it through a tool argument or alter the command.
    options.onBeforeSpawn?.();
    const child = spawn(executable, [...args], {
      cwd: options.cwd,
      shell: false,
      detached: process.platform !== "win32",
      stdio: ["ignore", "pipe", "pipe"],
      // Running trusted fixture code still does not require host/model credentials.
      env: { PATH: process.env.PATH ?? "", LANG: "C.UTF-8", TZ: "UTC", NODE_NO_WARNINGS: "1" },
    });
    const drain = (data: Buffer) => {
      total += data.byteLength;
      if (retained < outputLimit) {
        const kept = Buffer.from(data.subarray(0, outputLimit - retained));
        chunks.push(kept);
        retained += kept.byteLength;
      }
      // Both streams stay flowing even after the retained buffer is full.
    };
    child.stdout.on("data", drain);
    child.stderr.on("data", drain);
    child.on("error", () => { launchFailed = true; });

    const timeout = setTimeout(() => {
      timedOut = true;
      stopGroup(child, "SIGTERM");
      killTimer = setTimeout(() => stopGroup(child, "SIGKILL"), 200);
    }, timeoutMs);
    child.once("close", (exitCode) => {
      clearTimeout(timeout);
      if (killTimer) clearTimeout(killTimer);
      // Descendants can ignore TERM and close their pipes. Kill the group even when
      // the immediate child has already closed; close reaps the immediate child.
      stopGroup(child, "SIGKILL");
      const decoded = decodeUtf8Prefix(Buffer.concat(chunks, retained), retained, total > retained);
      const output = decoded.ok ? decoded.value : "[Process emitted invalid UTF-8; textual output omitted.]";
      const failedTests = [...output.matchAll(/^\s*not ok \d+ - (.+)$/gm)]
        .map((match) => match[1]!.slice(0, 240)).slice(0, 20);
      resolve({
        status: timedOut ? "timeout" : launchFailed ? "error" : exitCode === 0 ? "passed" : "failed",
        exitCode,
        durationMs: Math.round(performance.now() - started),
        output,
        outputBytes: total,
        retainedBytes: Buffer.byteLength(output),
        truncated: total > retained,
        failedTests,
      });
    });
  });
}

function stopGroup(child: ChildProcess, signal: NodeJS.Signals): void {
  if (!child.pid) return;
  if (process.platform === "win32") {
    // Windows does not support POSIX process groups. taskkill /T addresses the tree.
    const killer = spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
      shell: false, windowsHide: true, stdio: "ignore",
    });
    killer.on("error", () => child.kill(signal));
    return;
  }
  try { process.kill(-child.pid, signal); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ESRCH") child.kill(signal);
  }
}
