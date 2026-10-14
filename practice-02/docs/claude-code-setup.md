# Connect your Practice 02 tools to Claude Code

Run terminal commands from `algebra_ai_agents/practice-02/`. All paths below are relative to this folder. The model-facing tools run in separate Node processes; PostgreSQL runs in Docker. Claude Code starts the Node processes using `.mcp.json`.

## What each act produces

| Act | Your edit | How you use the result | Completion evidence |
| --- | --- | --- | --- |
| 1: direct reader | `src/student/01-reader-schema.ts` and `02-path-boundary.ts` | `npm run tool:demo` calls the shared reader as a TypeScript function. | `work/evidence/direct-tool.json` contains a successful read, `NOT_FOUND` and `PATH_DENIED`. |
| 2: workspace MCP | `src/student/03-register-reader.ts` | The supplied workspace server exposes the same reader through MCP. Claude Code discovers it from the project configuration. | Discovery plus E01–E04; a host session shows the named MCP tool and its arguments. |
| 3: tickets and diagnosis | `src/student/04-ticket-query.ts` | A second MCP server reads tickets from PostgreSQL in Docker. The combined checker uses both servers and checks the saved diagnosis. | E05–E06 and `work/evidence/combined-diagnosis.json`. |

Act 1 does not install a tool into Claude Code. `src/direct/demo.ts` calls `Workspace.readFile` in `src/core/workspace.ts`; the selected student modules supply its schema and folder decision. Act 2 supplies the protocol connection. Keep the expected CRLF fixture failure throughout the lab: the task is to build evidence interfaces and diagnose the supplied bug.

## Act 2: connect the workspace server

First complete TODOs 1–3 and run:

```sh
npm run typecheck
npm run tool:demo
npm run mcp:inspect
```

The inspection uses a supplied MCP client and writes `work/evidence/workspace-discovery.json`. It is an offline protocol check, separate from a Claude Code session. An incomplete registration can appear in a catalogue while its handler still returns `NOT_IMPLEMENTED`; execute the reader to check its behavior.

Create `practice-02/.mcp.json` with this content. When that file already contains unrelated project servers, preserve those entries and add `workspace-lab` inside its existing `mcpServers` object.

```json
{
  "mcpServers": {
    "workspace-lab": {
      "command": "node",
      "args": ["scripts/launch-server.mjs", "workspace"],
      "env": { "LAB_VARIANT": "${LAB_VARIANT:-starter}" }
    }
  }
}
```

Copy the supplied permission example to its active project filename. If the active file already contains other rules, merge the example's `permissions` entries instead of replacing them.

```sh
cp .claude/settings.example.json .claude/settings.json
LAB_VARIANT=starter claude mcp list
LAB_VARIANT=starter claude --permission-mode default
```

The active files live at `.mcp.json` and `.claude/settings.json` in the lab folder. `.mcp.json.example` and `settings.example.json` are reference examples. Do not start the workspace server in another terminal: Claude Code starts it and owns its stdio connection. `scripts/launch-server.mjs workspace` selects `src/servers/workspace.ts`, which creates the workspace and invokes your registration.

Review the project server when Claude Code requests approval. In the session, enter `/mcp` and check that `workspace-lab` is connected. The permission example allows named reads and asks for `run_tests`; its ticket rules become relevant when the second server is added. Keep the normal permission mode.

Use this explicit request to exercise your reader:

```text
Use mcp__workspace-lab__read_file with
{"path":"src/tokenizer.ts"}.
Show that tool's result and explain how the tokenizer handles CR and LF.
```

Then request the supplied test runner:

```text
Use mcp__workspace-lab__run_tests with
{"suite":"tokenizer"}.
Report the runId and failed test name from its result.
```

Review the requested suite before approving execution. The expected application result has `status: "failed"` and the CRLF test name; the tool succeeded in collecting that evidence. A Claude Code built-in file read or shell test does not demonstrate your MCP reader or runner. Record the actual tool name and arguments shown by the host.

## Act 3: add the ticket server

Start the supplied database:

```sh
npm run db:up
npm run db:probe
```

`db:up` creates ignored local credentials and starts the dedicated PostgreSQL service. `db:probe` uses the supplied reference lookup to check backend readiness and restricted privileges; it does not accept your unfinished TODO 4. Complete `src/student/04-ticket-query.ts`, then run:

```sh
npm run typecheck
npm run mcp:inspect -- --server tickets
npm run security:check -- --case E05
```

If the default database port is occupied, use `export LAB_DB_PORT=55433` before database setup and keep that export for later clients and the host. Repeat it in each new terminal. Restart Claude Code after changing the port so newly started servers inherit it. Follow the [Docker setup](../docker/README.md) for that route.

Add `ticket-store` to the same `.mcp.json`. The completed lab configuration is:

```json
{
  "mcpServers": {
    "workspace-lab": {
      "command": "node",
      "args": ["scripts/launch-server.mjs", "workspace"],
      "env": { "LAB_VARIANT": "${LAB_VARIANT:-starter}" }
    },
    "ticket-store": {
      "command": "node",
      "args": ["scripts/launch-server.mjs", "tickets"],
      "env": { "LAB_VARIANT": "${LAB_VARIANT:-starter}" }
    }
  }
}
```

Preserve any unrelated server entries. Exit the earlier Claude Code session and launch `LAB_VARIANT=starter claude --permission-mode default` from the same lab folder. Review the added server and use `/mcp` to check both connections. The Node ticket server reads the local database settings; no password belongs in this JSON.

```text
Use mcp__ticket-store__get_ticket with
{"ticketId":"LAB-101"}.
Identify the source file and test named in the ticket.
```

`LAB-101` is the stored synthetic bug report also available in [the readable report](lab-101.md). The ticket server runs on the host and sends fixed queries to PostgreSQL in Docker. The MCP resource `tickets://schema` describes fields; reading it does not prove that a database query works.

## Finish the investigation

Complete the core experiments and run the supplied combined checker:

```sh
npm run security:check -- --core
npm run diagnosis:verify
npm run verify:student
```

`diagnosis:verify` invokes both MCP servers with your selected student interfaces. It gets `LAB-101`, executes the tokenizer test, reads source and the run report, hashes the evidence, and writes a synthetic diagnostic report. It independently reads the stored fields through a restricted database role and repeats the fixture test with the reference runner. This is a supplied check, not an additional student implementation or an evaluation of model reasoning. Interactive host report writes still need review.

Submit the four student modules, six-section `findings.md`, E01–E06 evidence and the combined diagnosis capture. Use [the threat model](threat-model.md) before each boundary check to identify the bad input and expected safeguard, then record the actual result and independent observation in findings section 5. Read the illustrative API pairing in the appendix for findings section 2; calling the optional paid API is not required.
