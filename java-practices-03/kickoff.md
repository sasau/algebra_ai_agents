# Kickoff — paste into the main coding-agent conversation

```text
Act as the orchestrator described in .claude/agents/orchestrator.md.
Build Java 03 from the supplied plan, starting in this fresh kit copy.
STOP_AFTER=01

Read AGENTS.md, plan.md, log.md, contracts/ and workflow/ first.
Confirm the workspace is outside any existing Git repository before Step 01.
Step 01 must create the local Git repository and Maven project here.
Do not copy a solution or implement later steps early.

For each eligible step: record the base and next action in log.md, delegate the
bounded implementation to java-builder, the tests to test-builder, and actual
checks/review to verifier. Keep writing workers sequential. Verify the focused
tests, full Maven regression suite and specified manual observations. If any
check fails, log it and repair the same step; do not advance or commit success.

Keep exactly one worker active. Save the dispatched task ID in log.md and wait
for its real completion message before starting the next role. A background
acknowledgement is not completion. Never launch a helper or replacement while
that worker is pending. If normal approval is unavailable, stop and report it;
do not invent execution or change permission settings to continue.

After verification, update log.md and evidence, review the exact staged diff,
and make the step's named local commit. Confirm the commit and clean worktree
before writing the completion confirmation. That confirmation makes only log.md
dirty; carry it into the next checkpoint as the protocol describes. Follow
workflow/checkpoints.md and recover a
partial commit boundary through workflow/recovery.md.

Report the step, observed checks, commit hash and next action after every
checkpoint. Stop after STOP_AFTER or earlier if I request it. An immediate stop
preserves unfinished changes and records an interruption without marking done.
Do not push. At the stop point, give the exact resume prompt/file to use.
```
