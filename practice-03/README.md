# Practice 03 — Agent architectures

Build an explicit tool loop, add evidence-based retries, and delegate a bounded inspection to a child with fresh context. Everything required runs without a cloud API key. The supplied host, clients, safe file tools, trusted evaluator and verification are infrastructure; complete exactly three marked regions in `starter/`. `reference/` contains the finished implementation. The starter stays incomplete in the distribution.

A **URL slug** is a readable path identifier such as `hello-world` in `/articles/hello-world`. This lab accepts lowercase ASCII letters and digits, collapses punctuation/whitespace runs to one hyphen, removes edge hyphens, and maps empty or punctuation-only input to `""`. This is a deliberately small ASCII specification, not a multilingual slug library.

Use the course hub’s canonical Practice 03 slides alongside Lecture 03, slides 18–20 (ReAct), 25–26 (Reflexion), and 43–46 (sequential delegation). Broader multi-agent patterns and Plan-and-Execute comparisons are optional extensions.

## Start here — setup and reproduction share 15 minutes

Acquire the student repository once from any terminal directory. For an existing clone, skip cloning and change to its `practice-03` folder. Every subsequent lab command runs from `algebra_ai_agents/practice-03`:

```sh
mkdir -p ~/algebra-agent-labs
cd ~/algebra-agent-labs
git clone https://github.com/sasau/algebra_ai_agents
cd algebra_ai_agents/practice-03
npm ci
npm run doctor
npm run typecheck
npm test
```

Use Node >=22.12. `DOCTOR PASS` and infrastructure tests passing mean the supplied system is ready; they do not mean the three TODOs are implemented. Missing `tsx` means run `npm ci` in this directory. See [SETUP.md](SETUP.md) and [LOCAL.md](LOCAL.md) for installation and local inference.

The budget is **120 minutes**: setup and reproduction 15, Act 1 30, Act 2 25, Act 3 30, verification and submission 20. Save the named evidence after each checkpoint; do not replace a failed trace with an invented successful one.

## Reproduce the problem — within the setup budget

Read [`fixture/src/slugify.ts`](fixture/src/slugify.ts) and [`fixture/test/slugify.test.ts`](fixture/test/slugify.test.ts). The supplied source is Lecture 03's literal-space bug with input trimming:

```ts
return value.trim().toLowerCase().replace(/ /g, '-');
```

Run from the working directory above:

```sh
npm run fixture:test
```

Expected: **2 tests, 1 pass, 1 fail, exit 1**. `Hello, world!` becomes `hello,-world!`, while the contract requires `hello-world`. This failure is intentional. Do not edit the fixture or tests. The host creates a disposable source workspace per act. Its independent evaluator also runs three extra acceptance tests in [`trusted/acceptance.test.ts`](trusted/acceptance.test.ts), for **5 total**. Save the terminal output in your submission. A pre-green fixture means the supplied reproduction was changed; restore it before continuing.

## Act 1 — ReAct — 30 minutes

**What and why:** finish the model → request → dispatch → observation → history loop so each visible action has a matching tool result before the next model call. Edit only `starter/react-agent.ts`, between `BEGIN TODO_ACT_1` and `END TODO_ACT_1`, inside `runReact({host,messages,maxTurns})`. The supplied `Host` validates response IDs, bounds access and shares the call budget.

Append the complete assistant message first, including visible content and all `toolCalls`. For a single call, dispatch it and append `{role:'tool', toolCallId:call.id, content:observation}`. A completed response has no tool calls. For **multiple** requests, execute none and append a `SINGLE_TOOL_CONTRACT` error result for **every** requested ID; then permit a bounded retry. Never silently drop extra calls. Stop at `maxTurns`.

```sh
npm run act:1 -- --impl starter --client offline
```

Expected after implementation: `ACT_1 PASS client=offline calls=4 evidence=evidence/act-1-starter-offline-<unique>.json`. Before implementation: `FAIL` and `TODO_ACT_1`. A missing or mismatched tool ID fails history validation. Save the emitted immutable evidence path. Independently inspect its `histories`, `checkpoints` and `evaluation`: assistant content/request precedes its matching tool result; read/edit/test were requested; independent source tests pass 5/5. A model saying “done” is insufficient.

Compare the supplied finished solution when needed:

```sh
npm run act:1 -- --impl reference --client offline
```

## Act 2 — Reflexion — 25 minutes

**What and why:** use independent test feedback to change a failed attempt, write a short lesson, and stop bounded retries. Edit only `starter/reflexion.ts`, `BEGIN TODO_ACT_2`…`END TODO_ACT_2`, inside `runReflexion(ctx)`. Each attempt calls your Act 1 loop with fresh messages. Evaluate the saved source afterward. On failure with another attempt available, request a concise **visible lesson**, with no tools, then include it in the next attempt's user message. Preserve edited source and written lessons; start assistant/tool history fresh. Use `ctx.maxAttempts`, which is limited to 1–3 (the lab uses 2).

```sh
npm run act:2 -- --impl starter --client offline
npm run act:2 -- --impl starter --client offline --unsolvable
```

Expected completed normal case: `ACT_2 PASS ... calls=9`; evidence contains failed attempt → independent feedback → lesson → changed source → five passing checks. The first deterministic attempt deliberately keeps the punctuation bug. Expected unsolvable case: `ACT_2 PASS ... calls=9`, with `result.passed:false`, `attempts:2`, and `UNSATISFIABLE` feedback. Here `PASS` means the runner proved safe exhaustion; the contradictory task was not solved. There must be no attempt 3. Common failures are reusing tool history, ignoring evaluator failure or allowing retries beyond the limit. Save both emitted evidence files; independent completion checks inspect attempts, fresh histories, feedback and source differences.

Reflection is a bounded control mechanism. These scripted fixtures demonstrate the mechanism, not an improvement guarantee for a real model. Local inference may succeed on attempt 1, fail both attempts, or give an unhelpful lesson; report the observed outcome.

## Act 3 — Sequential delegation — 30 minutes

**What and why:** delegate a bounded exploration and make the parent verify the result. Edit only `starter/delegate.ts`, `BEGIN TODO_ACT_3`…`END TODO_ACT_3`, inside the callback returned by `makeDelegate({parent,run})`.

Use the supplied `validateBrief` and `validateChildReport` helpers in [`src/delegation-contract.ts`](src/delegation-contract.ts). They validate the full brief (`role:'explorer'`, objective, `sourcePath:'src/slugify.ts'`, acceptance list, `maxTurns:1…4`). Reject extra fields. Build a child `Host` at depth 1 with **only `read_file`**, the parent's client and shared budget, and **two fresh messages**: an explicit explorer role/return contract and the complete brief. Do not copy the parent's transcript. Reject nested delegation and concurrent calls. Validate the returned JSON: `{role:'explorer', summary, evidence:[{path:'src/slugify.ts', observation}], recommendation}`. Advice is untrusted until the parent reads/edits/tests and independent evaluation passes.

```sh
npm run act:3 -- --impl starter --client offline
```

Expected: `ACT_3 PASS client=offline calls=7` (parent 5 + child 2). Missing delegation, invalid JSON, write access in the child or missing parent test after delegation fails the checkpoint. Save the emitted evidence. Inspect child history separately: role + brief, read-only tool, structured report; parent receives only that report and verifies afterward.

[` .claude/agents/slug-explorer.md`](.claude/agents/slug-explorer.md) shows the corresponding Claude Code subagent role configuration. `tools: Read` restricts available tools; `permissionMode: plan` controls approval behavior for that agent. A role prompt describes its job, not enforceable filesystem isolation. The runnable lab host enforces its narrower exact-path allowlist, sequential operation and depth 1 independently. The YAML is documentation for Claude Code, not a runtime dependency; do not require a Claude subscription for the lab. See [LOCAL.md](LOCAL.md) for the separately verified limits of Claude Code–Ollama use.

## Verify and submit — 20 minutes

Run from the same working directory:

```sh
npm run typecheck
npm test
npm run verify:offline
npm run verify:student
npm run verify:completed-student
npm run verify:cloud -- --run-cloud
```

`verify:offline` checks the reference (three acts plus unsolvable exhaustion): **4/4, 29 scripted calls, no inference**. `verify:student` copies your current implementation and supplied infrastructure to a disposable directory, then checks the same four scenarios; expect **4/4** after completing the three TODOs. The distributed untouched starter intentionally fails. `verify:completed-student` fills exactly those three regions from reference in a disposable copy, then checks **4/4**; it never completes your starter in place. Both student routes record SHA-256 hashes proving the source starter stayed unchanged.

All JSON evidence has immutable unique filenames. Stable names such as `evidence/verify-offline.json` are convenience copies of the latest run; report the immutable path printed by the command. Failed runs remain evidence. No command edits the fixture or your starter.

Real inference is separate:

```sh
npm run verify:local
npm run verify:cloud -- --run-cloud
```

Local uses actual Ollama inference. The reusable root [local-models tutorial and probes](../local-models/README.md) also supports other practices. See [LOCAL.md](LOCAL.md) for measured capability and hardware. Cloud requires **both** explicit `--run-cloud` and `ANTHROPIC_API_KEY`; absent credentials produce `VERIFY_CLOUD SKIP` with the reason saved. Without `--run-cloud`, even a present key is ignored. A dummy-transport unit test is not real cloud inference. Offline/local clients do not load `.env` and never receive provider keys; the cloud adapter only targets the official Anthropic Messages endpoint. Use [SUBMISSION.md](SUBMISSION.md).

The implemented distribution’s exact test, inference and deck outcomes are recorded in [VALIDATION.md](VALIDATION.md).

## Supplied boundaries and limits

The host exposes bounded read, full-source edit and trusted test operations. Reads/edits are <=16 KiB; only `src/slugify.ts` is writable; test/config paths, traversal and symlinks are rejected. Tool errors become observations. Duplicate IDs, malformed provider responses, truncation, provider failures and timeouts fail explicitly. Every parent, child and lesson request consumes the same **24-call per-act budget**; the verifier also totals calls across scenarios. There is no arbitrary shell tool. Child depth is 1 and execution sequential.

Evaluation transpiles source with pinned esbuild, copies trusted tests into a new directory, strips credentials from the child environment, and runs Node's permission model with read access only to that directory, no file writes, child processes or workers, plus a 5-second timeout and a required five-test TAP result. This is a teaching boundary, **not an OS sandbox for hostile code**. Node 22 permissions do not provide full network/process isolation, and evaluator output is bounded rather than a proof of program safety. Run only lab code you are prepared to execute locally. Provider JSON responses are capped at 128 KiB; local calls time out at 60 seconds and cloud at 30 seconds.

Optional extension after submission: compare one prewritten Plan-and-Execute plan with the observed loop, discuss what fails when a plan becomes stale, or propose later-course parallel teams. Do not add these to the required implementation or 120-minute budget.
