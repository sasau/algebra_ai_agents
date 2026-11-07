# Checkpoint protocol — the orchestrator owns acceptance

## State model

`pending → in_progress → verified → complete` is the normal path. Use `failed`
after a failed check and `interrupted` after a mid-step stop. Both return to
`in_progress` for a new attempt. `verified` means all required checks passed on
the current source but the local commit is not yet confirmed. `complete` means
the committed checkpoint has been confirmed. Never start a successor from a
merely `verified` state. Update only the current step and append events.

## One step, one accepted commit

1. **Reconcile.** Read log.md, Git root/status/history and the previous evidence.
   Check STOP_AFTER. Before Step 01 there must be no enclosing Git repository.
   After Step 01, the Git root must equal this workspace. Before later steps,
   the previous completion commit must exist. A log-only dirty file is normal
   after confirming completion; unexpected dirty application files need review.
2. **Record intent.** Set the step to `in_progress`; save its base HEAD (or
   `UNBORN`), attempt number, writer, scope, required checks and next action in
   log.md. Keep the last observed committed checkpoint separately.
   Update the active step's table row as well as the current-state header.
3. **Implement and test.** Dispatch one writer at a time. Each receives step ID,
   base, exact files, required interfaces and checks. Record its result and
   actual file changes. A new attempt gets its own evidence directory.
   Wait for a worker to finish and stop writing before the next role starts;
   a background dispatch acknowledgement is not a completed candidate.
   Store the returned worker/task ID and role in log.md. While it is active,
   wait for its completion message; do not dispatch a replacement, a helper or
   the next role. Record its actual return and clear the active ID only after
   it has stopped. An approval prompt keeps that ownership in place.
   If approval is denied or unavailable, record the failure and stop that
   attempt; do not continue on unexecuted preflight or verification claims.
4. **Verify independently.** The verifier reads the resulting code, runs the
   named focused test class(es), then `mvn -B verify`, plus the step's manual
   checks. Require exit 0, real assertions, tests > 0, skips = 0 and correct
   observations. Save output before deciding. Record a SHA-256 manifest of the
   tested pom.xml and source/test files; confirm those files have not changed
   before staging the checkpoint. No pipelines that hide Maven's
   exit status. A failed command sets `failed`, with repair owner and next action.
5. **Prepare the checkpoint.** The orchestrator checks evidence and reviews
   the whitespace gate below, the diff and tests. Mark the current row `verified` and
   `checkpoint: this commit` in log.md, link its evidence, and record the intended
   commit message. Include all implementation, tests, docs, log and textual
   evidence. Exclude target/, cookies, IDE files and temporary runtime files.
6. **Commit the reviewed files.** Use an explicit `git add -- <paths...>` list;
   inspect `git diff --cached --stat` and `git diff --cached`, and run the
   staged whitespace gate below. Commit with the
   exact step message. In Step 01, confirm all four `.claude/agents/*.md`
   profiles are in the index and inspect untracked files before committing,
   as required by steps/01-bootstrap.md. Do not use blanket staging of
   unexpected files. On a
   commit failure, keep the step `verified`, record the error, and stop or repair
   the commit; the next step is not eligible.
7. **Confirm, then record.** After success, capture `git rev-parse HEAD`, check
   `git show --stat HEAD`, inspect HEAD's log/evidence and verify a clean tree
   **before** the confirmation edit. Then mark the row `complete` and put the
   observed hash in the live log. That confirmation edit makes only log.md
   dirty. Carry it into the next step's commit. No extra commit or amend is
   needed to insert a commit's own hash into itself.
8. **Report and obey the boundary.** Report the observed checks, hash and next
   action. Stop when STOP_AFTER is reached. At Step 10 the final live log may be
   the sole dirty file; it confirms the already committed final checkpoint.
   A fresh checkout recovers that checkpoint from its committed `verified` row.

## Why the committed log says verified

A Git commit cannot contain its own future hash. The accepted commit therefore
stores a complete verification record with `checkpoint: this commit`. Only after
Git succeeds can the live log say `complete` with its real hash. The next commit
carries that confirmation. Recovery validates Git and evidence instead of
assuming that a log edit and a Git write happened atomically. This also handles
interruption between those writes without duplicate commits or lost work.

## Evidence format

Use `evidence/step-NN/attempt-N/verification.md` and textual command outputs.
Record timestamp, cwd, Java/Maven versions when relevant, base HEAD, changed
paths, exact command, exit code, test counts/skips, expected/observed result and
any limitations. Failed attempts remain. A small Python subprocess wrapper or
another exit-preserving runner may capture stdout/stderr; a success paragraph
without executable evidence is insufficient. Never commit `.git/`, target/,
private credentials, binary test reports or personal cookie jars.

## Whitespace checks and verbatim command output

Maven can emit trailing spaces in stdout. Preserve those bytes in textual
command transcripts rather than editing evidence to satisfy a source check.
Run the whitespace gate on application files, tests, Markdown and structured
evidence; exclude only the verbatim `.txt` command outputs under evidence/:

```bash
git diff --check -- . ':(exclude,glob)evidence/**/*.txt'
git diff --cached --check -- . ':(exclude,glob)evidence/**/*.txt'
```

Review every excluded transcript for relevance and private data before staging.
The exclusion does not permit source whitespace errors or a failing test gate.
If an unscoped check was run and failed on raw output, retain its real exit code
and explain the scoped result; never report that the unscoped command passed.
