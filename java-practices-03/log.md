# Java 03 — durable progress log

## Current state

- Build status: not_started
- Active step: 01
- Step state: pending
- STOP_AFTER: 01
- Base commit: UNBORN
- Last observed committed checkpoint: none
- Attempt: 0
- Execution mode: not_started
- Active writer: none
- Changed files: none
- Required checks: see steps/01-bootstrap.md
- Open issues: none
- Next action: confirm this copy is outside every Git repository; begin Step 01
- Last update: not_started

## Step checkpoints

| Step | Status | Checkpoint | Evidence | Next action |
|---|---|---|---|---|
| 01 | pending | none | none | Create repository and Maven project. |
| 02 | pending | none | none | Start and close a health server. |
| 03 | pending | none | none | Add exact routing and greeting. |
| 04 | pending | none | none | Add bounded echo. |
| 05 | pending | none | none | Build concurrent session store. |
| 06 | pending | none | none | Integrate cookie sessions. |
| 07 | pending | none | none | Add concurrent admission control. |
| 08 | pending | none | none | Harden errors and shutdown. |
| 09 | pending | none | none | Measure the actual packaged server. |
| 10 | pending | none | none | Audit a fresh checkout and hand off. |

## Append-only events

The following is a template, not evidence of a run. Append one event at each
dispatch, worker return, check failure, verification, commit, interruption and
resume. Keep detailed command output in evidence/step-NN/attempt-N/.

```text
Timestamp (UTC):
Step / attempt / event:
Base HEAD / observed checkpoint:
Owner / allowed files:
Changed files:
Command / cwd / exit code:
Tests: run= ; failures= ; errors= ; skipped=
Expected / observed:
Evidence paths:
Open issues / repair owner:
Next exact action:
```

Only the orchestrator edits this log. A complete step needs actual evidence and
a confirmed local commit. `checkpoint: this commit` inside a committed verified
row is resolved to its hash after Git succeeds; see workflow/checkpoints.md.
