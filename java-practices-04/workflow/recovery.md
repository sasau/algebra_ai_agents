# Recovery — reconstruct from disk

Read AGENTS.md, log.md and the available root plan/contracts. If no reviewed
plan exists, resume planning from kickoff.md. Do not execute archived steps
or infer execution authorization from the presence of source or documents.

In execution mode inspect before mutating:

```sh
git rev-parse --show-toplevel
git status --short
git log --oneline -12
git show --stat HEAD
git diff
git diff --cached
```

Git may not exist yet in a fresh independent copy, or HEAD may be unborn
after an interrupted initialization. Inspect actual files and baseline
evidence. If Git points at a parent repository, stop execution and use an
independent copy; never change the parent or initialize a nested repository.

| Observed state | Next action |
|---|---|
| Planning incomplete | Inspect partial documents; finish the student's plan and stop for review. |
| Plan ready; no execution instruction | Report readiness; do not build. |
| Execution authorized; no baseline commit | Finish the verified baseline import before an implementation step. |
| in_progress, failed or interrupted | Preserve changes, inspect the same step and rerun required checks. |
| verified; intended commit absent | Check source and staging, refresh verification if needed, commit once. |
| Commit exists; live log still verified | Match message, parent/base, files and evidence; record its actual hash as complete without duplicating the commit. |
| Log says complete; commit missing/mismatched | Preserve files and reconcile the discrepancy before advancing. |
| Only the completion log edit is dirty | Carry it forward or stop at the requested boundary. |
| Unexpected changes outside ownership | Identify and preserve them; do not include them in blanket staging. |

Never accept a commit message alone as proof. Match its files, base/parent
and committed evidence; the initial baseline has no parent. Extra source
edits invalidate old evidence for those files. Do not reset, clean, amend,
delete partial work or invent a hash to repair state.

Reconcile any recorded worker ID before dispatch. Confirm the old writer
has stopped; terminate or join only this build's identified workers and test
servers. Do not start replacements while a task or approval is pending.
An interrupted verifier has no accepted result; rerun it in a new attempt.
If previous permissions prevented log writes, say so and recover from actual
files. Update the current phase/step, base, active worker, next action and
STOP_AFTER before continuing. Respect a direct stop immediately.
