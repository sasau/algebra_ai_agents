# Resume after stopping or clearing context

```text
Act as .claude/agents/orchestrator.md. Resume Java 03 from disk.
STOP_AFTER=01

Read AGENTS.md, plan.md, log.md, workflow/checkpoints.md and
workflow/recovery.md. Inspect Git root, status, log, HEAD's files and evidence.
Reconcile the checkpoint before writing anything. A log entry alone cannot
prove that a commit happened, and an interrupted verification must be rerun.

If the previous verified step has not been committed, rerun its checks and
complete that commit first. If its commit exists but log.md still says verified,
recognize the committed checkpoint instead of repeating implementation. If a
step is in_progress/interrupted, preserve its partial work, inspect it and
continue the same step. Do not reset or clean. If all earlier checkpoints are
complete, open only the next eligible step and its needed interfaces.

Use the supplied builder, test-builder and verifier roles. Reconcile any recorded
worker ID, stop or join abandoned workers, and wait for actual completion before
handing ownership to another. A background acknowledgement or a pending approval
is not a returned result. If permissions prevent a required action, record the
limit and stop the attempt. Apply the same
verification/evidence/commit rules as kickoff.md. Continue in dependency order
through STOP_AFTER, then report the current checkpoint and stop. Do not push.
```

Edit `STOP_AFTER` to the intended checkpoint before pasting. If the workspace
already contains a completed checkpoint beyond the chosen value, report it and
stop; do not roll it back. The full procedure is in `workflow/recovery.md`.
