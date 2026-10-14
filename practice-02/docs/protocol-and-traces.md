# Follow the call through each boundary

The direct CLI invokes `Workspace.readFile`. A Messages API client may receive a `tool_use` block, execute that handler and return a `tool_result` with the same `tool_use_id`. An MCP client instead sends JSON-RPC `tools/call`; the MCP adapter translates the shared envelope into text and `structuredContent`. These are distinct wire formats around the same domain behaviour.

The observed stdio sequence is `initialize` → initialize result → `notifications/initialized` → discovery and calls. The installed SDK **1.32.1** negotiates **2025-11-25** in the supplied capture. Protocol versions discussed in Lecture 02 are not automatically the revision implemented by this pinned SDK. See the official [lifecycle](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle) and [tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools) contracts.

| Observation | Representation in this lab | Interpretation |
| --- | --- | --- |
| Missing permitted file | `result.isError: true`, `structuredContent.ok: false`, `error.code: NOT_FOUND` | Expected domain error. A later call succeeds in the same session. |
| Invalid suite sent through raw RPC | Tool result with `isError: true` and text beginning `MCP error -32602: Input validation error` | Pinned SDK rejects the argument before the handler. Do not claim this capture is a top-level JSON-RPC error. |
| Unknown JSON-RPC method | Top-level `error.code: -32601` | Protocol method error; distinct from a tool domain failure. |
| Suite executes but CRLF test fails | Successful tool envelope containing `status: failed`, nonzero exit and failed test names | The operation collected evidence successfully. The tested program is defective. |
| Failure to finish a worker | Domain `TIMEOUT` | Execution failure; observe process cleanup separately. |
| Bad stdio banner | SDK transport parse error; this client may recover | Stdout was contaminated. Other hosts may terminate; the exercise does not claim universal recovery. |

`scripts/rpc.ts` intentionally bypasses client argument validation. The schema is enforced at the server. E02 also reads the same server's execution-attempt counter and uses a valid parser run as a control; E03/E04 observe different boundaries rather than relying on a rejection string alone.

`scripts/inspect.ts` uses a real SDK stdio client for discovery, resource reads and prompt retrieval. `db:probe` also includes an in-memory SDK client/server probe; label that transport accurately. `scripts/diagnosis.ts` uses two distinct stdio clients, then a separate restricted SQL read-back and a separate fixture run. Report IDs and run IDs have different meanings.

Each local capture is written under `work/evidence/` with timestamp, Node version and selected variant. Committed examples in `examples/transcripts/` are supplied evidence, not a student's own execution. The API pairing JSON is explicitly illustrative: no API call was made to produce it. `tokens:measure` emits byte counts and `null` for unmeasured token/context values. The optional live runner records actual `usage` and `stop_reason` when executed.

For host inspection, record `claude --version`, enabled servers, fresh/continued session, relevant permission decisions and `/context` output. An enablement decision, a tool annotation, a host action approval and a database grant are four different facts; one cannot substitute for another.
