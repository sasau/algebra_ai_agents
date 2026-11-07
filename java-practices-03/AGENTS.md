# Java 03 workspace rules

Read `plan.md`, `log.md`, `contracts/` and the active step before changing code.
The student has authorized implementation of the supplied plan, tests and one
local commit per verified step, up to the chosen STOP_AFTER. Do not push or
publish. Preserve unrelated changes and report any unexpected starting state.

The main session follows `.claude/agents/orchestrator.md`. It delegates to
`java-builder`, `test-builder` and `verifier` with the current step, base commit,
allowed files, acceptance checks and output format. Agents are authoring-time
tools; they are never part of the Java HTTP request path.

Only one worker of any role runs at a time in this exercise. Builders change only their assigned
files. The verifier independently executes commands and reviews behavior; it
never accepts a prose success report. Workers never modify `log.md`, the plan,
contracts, previous evidence or Git history, and never make commits. The
orchestrator alone owns checkpoint acceptance and Git operations. If subagents
are unavailable, use the same roles sequentially in the main session and record
`execution_mode: sequential-role-fallback`; do not claim independent agents ran.

A native dispatch can return a background acknowledgement before the worker
finishes. Save its worker/task ID in log.md and keep ownership with that worker.
Wait for its actual completion message and confirm it has stopped before the
next dispatch. Yield the turn if necessary; do not launch another worker to
poll, replace or supervise one that is still running. Do not create helper or
nested orchestrator agents. Before every dispatch, require active worker = none.

If a command or write needs approval, wait for normal approval. A pending
permission prompt is not a worker failure or completion. If approval is denied
or the runner has no approval surface, stop the active attempt, preserve partial
files and record the failed command and exact next action. Do not delegate around
the denial, invent a conceptual log update, or add permission-bypass settings.
If log.md cannot be written, report that progress was not persisted.

Each step contains one coherent feature and its verification. Run its focused
checks and the complete `mvn -B verify` regression gate before accepting it.
Skipped or zero tests are not a successful verification. Keep Surefire
`failIfNoTests=true`, and do not weaken assertions, remove existing tests, add
preview features, or expand scope to obtain a green build.

Before a worker starts, update `log.md` with the current step, base commit,
ownership and next action. Flush progress after meaningful changes, failures,
worker returns and stop requests. Store actual command, working directory,
timestamp, exit code and relevant output under `evidence/step-NN/attempt-N/`.
Do not overwrite failed attempts or put private model reasoning in evidence.
Keep the current-state header and the active step's table row consistent.

Follow `workflow/checkpoints.md` for the verified → commit → complete boundary.
Follow `workflow/recovery.md` after any interruption, including commit failure.
Never reset, clean, amend or invent completion to repair a checkpoint. If
stopping mid-step, preserve changes and mark `interrupted`; do not make a
completion commit. Honor a direct stop immediately and log the state if tools
remain available. An abrupt process termination may leave the last recorded
state at `in_progress`; recovery inspects the actual files before continuing.
