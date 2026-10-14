# Practice 02 — Tools and MCP

The repository already contains a small arithmetic application in `fixture/`. Its tokenizer splits text such as `12 + 3.5` into number and operator tokens. Its parser evaluates expressions while respecting multiplication before addition. A supplied test shows a bug: the tokenizer accepts an ordinary newline but rejects the carriage-return character in a Windows-style CRLF newline. You investigate that existing application; the four required tasks do not ask you to build a calculator or repair its bug.

Your job is to build interfaces that obtain evidence about this bug. First, complete a file reader and its folder boundary. Then expose that reader through the supplied workspace MCP server. Finally, complete a query in the second MCP server, which obtains synthetic bug tickets from PostgreSQL in Docker. MCP (Model Context Protocol) is the standard connection through which an agent host such as Claude Code discovers and calls these servers' tools. Each server checks requests before acting on files, processes or database rows.

The concrete investigation is ticket `LAB-101`: read the ticket, inspect the tokenizer source, reproduce the failing test, and save a diagnosis. The final checker reads the stored diagnosis back from the database and checks its evidence independently. This lab accompanies Lecture 02 and Practice 02, “Tools and MCP”, in `ai-agents/course-c` and contributes **Tools & MCP, 12 points**, to the course harness. This supplied demonstration application is separate from the Session 15 capstone.

Read the supplied [LAB-101 bug report](docs/lab-101.md) now. It shows the title, reproduction instructions, expected behavior and the exact source/test files to open. The same report is seeded into PostgreSQL on first database setup and retrieved through the ticket server later. You can begin the source/test investigation before Docker is started. The slides guide every implementation and check; this file gives you a readable copy of the report they discuss.

## What is supplied and what you implement

Open the lab in `practice-02/`. Commands below run in a terminal whose current directory is this folder. Source paths in the file-reader requests have a different base: the reader's allowed folder is `fixture/`, so its request `src/tokenizer.ts` refers to `fixture/src/tokenizer.ts`.

| Location | What it contains | Your action |
| --- | --- | --- |
| `fixture/src/` and `fixture/test/` | The supplied arithmetic application and its tests, including the expected failing newline test. | Inspect the code and run the supplied test command. |
| `src/student/` | Four numbered incomplete TypeScript modules. | Complete the four TODOs below. |
| `src/core/`, `src/servers/` and `docker/` | Supplied file guards, process runner, MCP servers and database setup. | Inspect and exercise these mechanisms; they are not extra required implementations. |
| `src/reference/` | Supplied completed versions of the four student interfaces. | Use for labelled instructor demonstrations and comparison. |
| `work/evidence/` | Results saved by the lab's check commands. | Record your observations and select evidence for submission. |

The starter compiles but returns `NOT_IMPLEMENTED` where work is incomplete. It never uses an unsafe implementation as a placeholder. Complete four files in `src/student/`, preserving their exported interfaces:

| TODO | File | Acceptance evidence |
| --- | --- | --- |
| 1 | `01-reader-schema.ts` | A strict object defines one bounded `path` string, rejects extra fields, and describes the root, size cap, and error behaviour. Supplied semantic guards enforce relative-path access. Set `readerContractComplete` after completing the contract. |
| 2 | `02-path-boundary.ts` | Both lexical and canonical paths remain inside the root. The root itself and separator-aware descendants are handled correctly; a similarly prefixed sibling and an external symlink are refused. |
| 3 | `03-register-reader.ts` | Register the shared reader with its schema, description, annotations and `toMcp` result adapter. Do not reproduce its file logic in the server. |
| 4 | `04-ticket-query.ts` | Pass `ticketId` as `$1` through the supplied `TICKET_SELECT`; return `ok(rows[0] ?? null)`. Quotes remain data and another project's ticket is inaccessible. |

`src/reference/` completes these same interfaces for instructor demonstrations. Process supervision, durable report storage, database provisioning and idempotency are supplied mechanisms to inspect and exercise. Copying the reference can demonstrate the completed path, but your findings must explain each boundary and contain your own captures.

## Before class

Use **Node 22.12 or later**, npm, Git, Claude Code, and a running Docker engine with `docker compose` or `docker-compose`. Use macOS, Linux, or WSL2 on Windows; descendant cleanup has not been validated on native Windows. The core lab needs no model API key. The first database start needs network access to pull the pinned PostgreSQL image.

Use the same student repository as Practices 00 and 01:

```sh
git clone https://github.com/sasau/algebra_ai_agents
cd algebra_ai_agents/practice-02
npm ci --ignore-scripts
npm run doctor
npm run typecheck
[ -f findings.md ] ||
  cp findings.template.md findings.md
```

If you already have the repository, open its `practice-02/` folder instead of cloning again.

`doctor` distinguishes a missing prerequisite, a pending database, and an incomplete student reader. `NOT_IMPLEMENTED` at this stage is expected. Do not paste `.env.local` into a terminal transcript; `db:up` creates disposable database credentials there with mode `0600`.

For an instructor walkthrough of the completed code, prefix commands with `LAB_VARIANT=reference`. The default is `starter`. The general scripts read this shell variable; the optional paid runner also loads `.env`. Do not expect copying `.env.example` to switch every command's variant.

## 120-minute route

| Phase | Minutes | Work and checkpoint |
| --- | ---: | --- |
| Setup | 10 | Install, doctor, identify the seeded test and evidence directory. |
| Act 1 — direct tool | 25 | Complete TODOs 1–2; inspect result/error data and call/result pairing. |
| Act 2 — workspace MCP | 35 | Complete TODO 3; inspect discovery, resources and prompt; execute E01–E04. |
| Act 3 — Docker and combined diagnosis | 40 | Start PostgreSQL; complete TODO 4; execute E05–E06 and independently verify the diagnosis. |
| Submission | 10 | Review evidence and limitations, run student verification, finish findings. |

The retained Practice 02 deck has 97 workbook pages and eleven diagrams. Start with the infographic on page 2: it maps the four TODOs to the file reader, workspace MCP server and PostgreSQL-backed ticket MCP server, then shows the finished investigation and its independent checks. Read the actual LAB-101 report on page 5, complete setup on page 6, then reproduce the named failure on page 7. Each lab step names the file or test to open, shows the command or code change, explains the expected result, and connects it to the investigation. Terminal commands, source code and observed output are separate blocks. The slides themselves guide the implementation and checks; the linked documents provide readable supporting copies. Follow the core route in class; the optional API and E07–E12 pages are reference material. E01–E12 are experiment labels used by this lab, not error codes from the arithmetic application.

The practice agenda tags all five phases (120 minutes); the three acts alone total 100 minutes. Setup and submission account for the remaining 20 minutes. Complete setup before class if downloads would consume this time. E07–E12 and the HTTP/model exercises are guided inspections or extensions, not six additional implementations.

## Act 1: the handler works before MCP

Read `src/core/result.ts`, `src/core/workspace.ts`, the first two student modules and their reference counterparts. The permitted root is `fixture/`; `src/tokenizer.ts` is relative to that root, not to this README. The reader returns up to 20,000 UTF-8 bytes and explicit truncation metadata.

```sh
npm run typecheck
npm run tool:demo
npm run fixture:test
```

After TODOs 1–2, the demo returns a successful tokenizer read, `NOT_FOUND` for `src/missing.ts`, and `PATH_DENIED` for an escape. It writes `work/evidence/direct-tool.json`. An incomplete demo exits with code 2. **`fixture:test` must fail exactly the CRLF test**: `tokenizer normalises CRLF line endings`. This is the bug to diagnose. The lab's verification tests must pass; their green status does not mean the fixture bug was repaired.

Study [the trace guide](docs/protocol-and-traces.md) and the offline illustrative Messages API trace. Each `tool_result` answers the original `tool_use_id`; a missing file is error data, not a reason to lose the conversation state.

## Act 2: shared logic through a complex MCP server

Complete TODO 3. `workspace-lab` exposes five tools, the static resource `workspace://manifest`, the template `workspace://reports/{runId}`, and the prompt `diagnose_test_failure`. Inspect all three primitive types and the actual initialize exchange.

```sh
npm run mcp:inspect
npm run security:check -- --workspace
npm run lab:broken -- --case E03
```

The inspection saves `work/evidence/workspace-discovery.json`. E01 proves a missing-file error does not break the same protocol session. E02 bypasses client validation and sends command text in a suite; the server must reject it before a spawn. E03 checks parent, prefix and symlink escapes. E04 observes output draining and descendant termination; a timeout Promise by itself is insufficient.

To use Claude Code from **this lab directory**, prepare project-local examples:

```sh
cp .mcp.json.example .mcp.json
cp .claude/settings.example.json .claude/settings.json
claude mcp list
claude
```

Review the project MCP configuration when the host asks. Inspect `/mcp` and `/context` in a fresh session and record CLI version and conditions. The supplied rules allow named reads and ask for `run_tests` and `create_diagnostic_report`. Use default permission mode. Review each proposed action's tool, arguments and effects. An annotation such as `readOnlyHint` is advisory; it does not enforce a policy or SQL grant. Run `db:up` before expecting `ticket-store` to connect.

The launcher does not forward your model credential into MCP processes or fixture workers. Stdio stdout carries JSON-RPC only; diagnostics belong on stderr. The runner uses fixed suite argv and `shell: false`, executes only the trusted lab fixture, allows one job, stops it after 10 seconds, and retains at most 20,000 output bytes. Report storage keeps the last 20 runs; save evidence before older reports expire.

## Act 3: a restricted Docker backend

```sh
npm run db:up
npm run db:probe
```

The first command starts only the dedicated lab database. The second checks actual MCP ticket lookup and fixed SQL permission denials through the restricted roles. A database service and an MCP `resource` are different concepts: PostgreSQL stores ticket and diagnosis rows; reading the MCP resource `tickets://schema` returns a supplied description of the allowed database fields. It does not create a database connection or permit arbitrary SQL. See [Docker setup](docker/README.md) for port conflicts and volume lifecycle.

Complete TODO 4, then run:

```sh
npm run mcp:inspect -- --server tickets
npm run security:check -- --core
npm run diagnosis:verify
npm run verify:student
```

Discovery shows three ticket tools and two resources. E05 checks prepared values, fixed project scope and denied grants. E06 repeats an identical report submission after the ticket MCP server restarts: the receipt reuses the original ID and an independent SQL count remains one. Changing the payload under the same key returns `IDEMPOTENCY_CONFLICT`.

`diagnosis:verify` obtains `LAB-101`, executes the real tokenizer suite, reads the bounded source and report resource, hashes the report, stores a diagnostic row, and independently matches the row and digest through a restricted database connection. It separately reproduces the failing suite. A stored digest is a claim until those checks are performed. The deterministic verifier writes synthetic lab reports; interactive host writes still require review.

`verify:student` checks types, E01–E06 and combined diagnosis using your student modules. Before completion, its failure is expected. Instructor acceptance uses `LAB_VARIANT=reference npm run verify:reference`, which additionally runs all integration tests and E01–E12. Verification does not call a paid model.

## Bugs, security exercises and extensions

Use [the exercise index](exercises/README.md), [threat model](docs/threat-model.md) and [incident sources](docs/incidents.md). Broken demonstrations are explicitly selected, synthetic reconstructions. Normal server startup never imports them. The selected `lab:broken` command always runs the supplied reference path, even when student modules are incomplete. Use `security:check` and `verify:student` with the default starter variant to assess your implementation.

```sh
npm run lab:broken -- --case E02
npm run lab:broken -- --case E04
npm run lab:broken -- --case E07
npm run lab:broken -- --case E08
npm run lab:broken -- --case E09
npm run lab:broken -- --case E11
npm run security:check -- --case E10
npm run http:check
npm run tokens:measure
```

Use `LAB_VARIANT=reference` for supplied completed demonstrations while your starter is unfinished. E07 is deterministic enforcement against an injected ticket; it does not measure a model's resistance. E08 snapshots a changed description and never registers a poisoned server in your ordinary host. E09 observes the pinned client's actual parse error/recovery. E11 and `tokens:measure` measure UTF-8 **bytes**, not model tokens or `/context` usage.

Optional: add a bounded tool, repair the CRLF bug and compare run IDs, inspect local authenticated Streamable HTTP, or execute the paid demonstration:

```sh
cp .env.example .env
# Edit .env privately: set ANTHROPIC_API_KEY and a model you can access.
npm run tool:live
```

The live runner permits at most four API requests and 500 output tokens per request, with SDK retries disabled. Charges can still apply. It records actual API usage if executed. The committed pairing example is illustrative and is not a live capture. If you repair the fixture, record before/after evidence separately; the supplied diagnosis verifier intentionally expects the original failure and is for the unmodified fixture.

## Submission, cleanup and troubleshooting

Submit four completed student modules, `findings.md` with its six sections, and selected evidence files. Include executed commands, observed values, expected results and limitations. Exclude `node_modules/`, credentials, local host settings, and unrelated personal data. Keep supplied examples labelled as supplied; they are not your observations.

```sh
npm run db:down
```

This stops the dedicated backend and retains its volume. To erase **only this disposable lab**, use `npm run db:reset -- --confirm-lab-reset`, then `db:up`. Do not use global Docker pruning.

| Symptom | Next step |
| --- | --- |
| `NOT_IMPLEMENTED` | Complete the numbered module; confirm `LAB_VARIANT` and restart the host server after edits. |
| Database unavailable | Start Docker, run `db:up` then `db:probe`; inspect port selection without printing credentials. |
| Port 55432 occupied | Run `export LAB_DB_PORT=55433` in the lab terminal, then `npm run db:up` and `npm run db:probe`. Keep that terminal setting for subsequent checks and launch the host there with `LAB_VARIANT=starter claude`; an unconfigured launcher or client otherwise selects 55432. |
| Password mismatch after editing `.env.local` | Restore its prior values or explicitly reset this lab volume; existing PostgreSQL volumes do not reinitialise passwords. |
| MCP handshake or parse failure | Confirm lab working directory, Node version and dependencies; send server logs to stderr. Use `mcp:inspect` outside the host. |
| Invalid suite or missing file | Examine the bounded error result. Do not broaden permissions to make invalid input work. |
| Old run ID returns `NOT_FOUND` | Report retention is 20 runs. Generate a fresh run and save your evidence promptly. |
| Expected fixture test is green | Restore the original fixture for core verification or document your optional repair separately. |

See [versions and validation](docs/versions-and-validation.md) for tested versions, platform coverage and verification limits.
