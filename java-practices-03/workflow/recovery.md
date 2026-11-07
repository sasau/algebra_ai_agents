# Recovery — reconstruct progress from disk

Read the current log, plan and relevant step. Inspect, do not mutate first:

```bash
git rev-parse --show-toplevel
git status --short
git log --oneline -12
git show --stat HEAD
git diff
git diff --cached
```

Before Step 01, the first Git command is expected to fail. During an interrupted
Step 01, the repository may exist with an unborn HEAD; failed `git log` then
means there is no first commit yet. Verify the Git root still equals the fresh
workspace. If Git points to the practices repository or another parent, stop
and move to a fresh copy; do not commit into that repository.

| Observed state | Required next action |
|---|---|
| Pending, no code, no repo | Start Step 01 after the outside-repository preflight. |
| in_progress, failed or interrupted; partial changes | Read the actual diff and last attempt. Keep changes, finish that same step and rerun its focused and regression checks. |
| verified in live log; intended commit absent | Treat verification as potentially stale. Inspect source/staging, rerun required checks, refresh evidence and commit once. |
| Commit exists; live log still verified | Check exact message, parent/base, committed log and evidence. If the working code matches that commit, record complete with its hash; do not repeat implementation or commit. |
| Live log says complete; commit absent or mismatched | Treat the discrepancy as unresolved. Inspect history and diffs; do not advance until reconciled. Never invent a hash. |
| Commit succeeded; only completion log edit is dirty | Keep that edit. Select the next eligible step or stop at the requested boundary. |
| Final fresh checkout has Step 10 verified | Validate HEAD's final checkpoint and evidence, record its observed hash as complete in the live log, and stop. |
| Unexpected changes outside current ownership | Preserve them and identify their source before staging or advancing. |

Find the intended checkpoint using its exact step message **and** its files,
base/parent and committed evidence, not the message alone. An initial commit
has no parent. A commit from a different checkout is not proof of this build.
If a committed checkpoint is found but additional code edits exist, preserve
them, determine their scope, and verify before proceeding. Do not attribute
evidence from the old tree to new source.

After reconstruction, state the current step, last accepted hash, open issue,
next command and STOP_AFTER in log.md before any dispatch. Load the active
step, its interfaces and necessary source only. The previous chat is optional.
An interrupted verifier has no accepted result; rerun its commands. Terminate
or join abandoned workers and test servers before starting replacements.
Use the recorded worker/task ID to identify only this build's workers; do not
terminate unrelated Claude or Java processes. A queued acknowledgement proves
neither completion nor cancellation. Confirm the former owner has stopped
before clearing its ID and handing the paths to a replacement. If a permission
denial prevented log writes, recover from actual files and explicitly note that
the previous session could not persist its claimed progress.
