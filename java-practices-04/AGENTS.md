# Java 04 workspace rules

Read assignment.md, log.md and .claude/agents/orchestrator.md first.
This is an existing Java 21/Maven server, not an empty project. The root
source and tests are the completed Java 03 reference. Do not bootstrap or
recreate them. Files under plans/ are reference material, not active tasks.

## Planning is the initial mode

Default MODE=PLAN and STOP_AFTER=PLAN. Inspect the baseline, run it and
create the student's own plan.md, steps/, contracts/transport.md and
contracts/design.md. Keep all implementation steps pending in log.md.
Planning may change documents and write fresh evidence; it must not edit
production code, tests or pom.xml, initialize Git, or make commits.
Do not dispatch implementation workers in planning mode. Stop with a
reviewable plan. A separate explicit student instruction starts execution.

## Execution uses the reviewed plan

Require MODE=EXECUTE, an explicit STOP_AFTER, and a reviewed plan. Read
plan.md, contracts/ and the active step before code changes. Run execution
in a fresh independent student copy outside the shared practices repository.
Follow workflow/checkpoints.md for the verified baseline and checkpoint
commits. Never commit into a parent repository or initialize a nested one.
Maven and source already exist; only an independent local Git history may
need initialization. Never push or publish. Preserve unrelated changes.

The main session is the orchestrator. It delegates to java-builder,
test-builder and verifier with step, base, allowed files, interfaces,
acceptance commands, evidence directory and return format. These are
authoring-time roles, never part of the server's request path. Use one
worker at a time, in that order. Workers must not delegate further.
If native subagents are unavailable, use the roles sequentially and record
execution_mode: sequential-role-fallback; do not claim independence.

Before dispatch, require active worker = none and record intent in log.md.
Persist the actual task ID after dispatch. An acknowledgement or queued
task is not completion. Wait for actual completion and confirm the worker
stopped before transferring ownership. Never launch helpers, replacements
or nested orchestrators while a worker is pending. Yield when needed.
Workers never edit log.md, plans, contracts, previous evidence or Git state;
only the orchestrator accepts checkpoints and makes commits. The verifier
may write new evidence in its assigned attempt directory.

Use normal tool permissions. Pending approval retains worker ownership.
If denied or unavailable, preserve partial work, record the exact failed
command and next action, and stop that attempt. Do not bypass permissions
or claim an unwritten log was persisted.

Keep Java 21, real behavioral assertions and failIfNoTests=true. Do not
remove or weaken existing tests, skip tests, add preview features or expand
scope to obtain success. Adapt JDK-specific seams only through the reviewed
interfaces and preserve their behavioral coverage. Keep a runnable JDK
transport for comparison. Final compatibility includes chunked request bodies.

Every accepted implementation step requires focused tests, full mvn -B
verify and its manual checks on the exact current source. Zero/skipped tests
are not acceptance. Preserve actual timestamp, cwd, command, exit, output
and a tested-file SHA-256 manifest under evidence/step-NN/attempt-N/.
Retain failed attempts. Never include private reasoning or secrets.

Update log.md before dispatch and after progress, failures, worker returns
and stop requests. Keep its header and active table row consistent. Follow
workflow/checkpoints.md for verified -> commit -> complete and
workflow/recovery.md after interruption. Never reset, clean, amend or invent
completion. Honor stop immediately; preserve partial work and record an
interruption if tools remain available. Report actual checks and next action.
