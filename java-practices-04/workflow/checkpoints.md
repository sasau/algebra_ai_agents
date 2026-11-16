# Checkpoint protocol

## Planning boundary

Planning creates documents and new evidence only. It may run the baseline
suite. It does not initialize Git, commit, dispatch implementation workers
or change source/tests/POM. Stop with a reviewable plan and pending steps.
Archived plans are examples. Execution requires a later explicit student
instruction, a reviewed root plan and STOP_AFTER naming one of its steps.

## Independent execution workspace and baseline

Run Git root/status checks before any initialization. Implementation must
use an independent student copy. If Git points at the shared practices
repository or any parent, stop and make a fresh copy outside it; never init
a nested repository or commit into the parent. Preserve unexpected files.

In an independent copy with no Git repository, the execution instruction
authorizes `git init` and a baseline commit. The Maven project already
exists. Record intent in log.md, run `mvn -B verify`, inspect nonzero test
totals and zero failures/errors/skips, and save fresh evidence plus a hash
manifest. Review the files, explicitly stage the starter, planning documents
and textual evidence, then commit `baseline: import verified Java 03 starter`.
Exclude target/, .git/, cookies and local runtime files. Confirm the hash
and clean tree before recording it in log.md. No Java 04 step is complete
merely because this baseline exists. Resume an existing independent Git
history by reconciling it, not by reinitializing or duplicating the import.

## One implementation step, one accepted commit

Normal states are `pending -> in_progress -> verified -> complete`.
Failed checks set `failed`; a direct interruption sets `interrupted`.
Resume those as `in_progress` with a new attempt. `verified` is not complete:
only a confirmed local commit accepts the checkpoint.

1. Reconcile log, Git root/status/history, dependencies, evidence and
   STOP_AFTER. Require the previous accepted checkpoint or baseline hash.
2. Record step, base HEAD, attempt, ownership, exact checks and next action
   in the current-state header and checkpoint row before dispatch.
3. Dispatch java-builder, then test-builder, then verifier, one at a time.
   Supply the bounded task envelope. Persist each actual task ID. Wait for
   real completion and confirmed stopped ownership before the next role.
   An acknowledgement or pending approval is not completion. No helper or
   nested workers. Record sequential-role-fallback if native workers cannot run.
4. The verifier executes the named focused tests, full `mvn -B verify` and
   required manual checks. Require exit 0, real nonzero tests and zero
   skips/failures/errors. Save actual outputs and a SHA-256 manifest of
   pom.xml, production source and tests. Keep failed attempts. Failed gates
   assign a repair owner and prevent advancement; obey bounded repair limits.
5. Review the actual diff, evidence and source hashes. Changes to tested
   source invalidate acceptance until reverified. Mark `verified`, record
   `checkpoint: this commit`, evidence paths and intended commit message.
6. Explicitly stage only reviewed implementation, tests, docs, log and
   textual evidence. Inspect staged stat and diff; run the whitespace gate.
   Commit with the active step's message. On commit failure retain verified
   state and record the failure; do not start a successor.
7. Capture HEAD's actual hash, inspect its files and committed log/evidence,
   and confirm a clean tree before the completion edit. Then record
   `complete` and the observed hash in live log.md. Only that log confirmation
   should become dirty; carry it into the next checkpoint. No amend or extra
   commit is needed to put a commit's own hash inside itself.
8. Report actual checks, hash and next action. Stop at STOP_AFTER or a direct
   stop. At the last step the live confirmation may remain the sole dirty
   file. A fresh checkout can recover its committed verified state.

## Evidence and whitespace

Use new `evidence/step-NN/attempt-N/` directories with verification.md,
`.stdout.txt` and `.stderr.txt` transcripts, command metadata and tested-file
SHA-256 hashes. Include timestamps, cwd, exact commands, base, exits, test
totals and expected/observed behavior. Keep failed attempts and actual exit
codes. A Python subprocess wrapper may capture output; do not use pipelines
that hide Maven's exit. Do not record secrets or private model reasoning.

Keep raw output byte-for-byte. Maven may emit trailing spaces; exclude only
verbatim `.txt` transcripts from the whitespace checks, and inspect them for
relevance/private data before staging:

```sh
git diff --check -- . ':(exclude,glob)evidence/**/*.txt'
git diff --cached --check -- . ':(exclude,glob)evidence/**/*.txt'
```

Record performance as observed count, concurrency, elapsed time,
successes/failures and successful requests per second, with machine/JDK.
Correctness is a separate gate. Never copy historical speed as a new result.
