import assert from "node:assert/strict";
import { RawRpc } from "./rpc.js";

/** Bypass client argument validation and measure the actual server execution path. */
export async function runCaseE02(): Promise<unknown> {
  const rpc = new RawRpc("workspace");
  try {
    await rpc.initialise();
    const count = async (): Promise<number> => {
      const response = await rpc.request("resources/read", { uri: "workspace://manifest" });
      assert.equal(response.error, undefined);
      const manifest = JSON.parse(response.result.contents[0].text);
      assert.equal(Number.isInteger(manifest.observation.executionAttempts), true);
      return manifest.observation.executionAttempts;
    };
    const executionAttemptsBefore = await count();
    assert.equal(executionAttemptsBefore, 0, "A new server session has not attempted a fixture execution.");
    const rejection = await rpc.request("tools/call", {
      name: "run_tests", arguments: { suite: "all; echo LAB_CANARY" },
    });
    assert.ok(rejection.error || rejection.result?.isError, "The server must reject invalid suite input.");
    const executionAttemptsAfterRejection = await count();
    assert.equal(executionAttemptsAfterRejection, executionAttemptsBefore, "The invalid raw call must not reach spawn.");

    // A same-session positive control proves the counter is active. No completed
    // report or lack of a report is used as a substitute for execution measurement.
    const control = await rpc.request("tools/call", { name: "run_tests", arguments: { suite: "parser" } });
    assert.equal(control.error, undefined);
    assert.equal(control.result.structuredContent.ok, true);
    assert.equal(control.result.structuredContent.value.status, "passed");
    const executionAttemptsAfterControl = await count();
    assert.equal(executionAttemptsAfterControl, executionAttemptsBefore + 1, "One valid control must reach spawn exactly once.");
    const unknownMethod = await rpc.request("not/a/method", {});
    assert.equal(unknownMethod.error.code, -32601);
    return {
      exercise: "E02", rejection, unknownMethod,
      executionAttemptsBefore, executionAttemptsAfterRejection, executionAttemptsAfterControl,
      control: { suite: "parser", status: control.result.structuredContent.value.status, runId: control.result.structuredContent.value.runId },
      measurement: "Observed session-local execution-attempt counter incremented immediately before spawn, with a successful same-session control. This is not an OS-level execution trace.",
      trace: rpc.trace,
    };
  } finally { await rpc.close(); }
}
