# Step 10 — Audit a fresh checkout and deliver the completed project

Dependency: 09. Begin only after earlier steps have verified local commits.
The interfaces and expected behavior in contracts/ are specifications to build.

## Build logic and verification cases

Add application documentation in docs/server.md: architecture, endpoint table,
JAR startup, curl session sequence, load command, configuration, shutdown,
in-memory/absolute-expiry semantics and measured limitations. Keep this README's
starter workflow and original contract accessible. Link real source and test
files; do not describe unimplemented code or guessed performance.

Run the full regression gate and actual packaged health/hello/echo/session
sequence. Inspect Surefire XML, test inventory and evidence for all previous
steps. Confirm each step has a distinct local commit with the expected diff,
and no target files, cookie jars or private state were staged. Step 10 itself
does not require a new superficial JUnit test; it audits the existing behavior.

Verify a fresh temporary checkout of the Step 09 checkpoint (`git clone --local
<workspace> <new-temp-directory>`). Run mvn -B verify there and observe packaged
health/session behavior on a free port. This checks that untracked files in the
working tree were not secretly required. Record its exact checked-out hash.
The Step 10 change is documentation/evidence only, so that is the source under
test. If this audit requires a code repair, log the extra scope and repeat the
fresh-checkout verification on the repaired candidate before acceptance.

Rehearse recovery in a disposable copy: start a fresh conversation/role from
resume.md with the stop point set to its current checkpoint. Reconstruct the
step, observed hash, evidence and next action from disk without building later
steps. Also inspect the committed verified → live complete log boundary. Do
not reset the student's working repository to simulate an interruption.

Capture all evidence, mark verified, make the Step 10 commit, confirm it, then
update the live log to complete with the actual hash. A log-only dirty file is
the documented confirmation state; no amend or extra commit is required.
Finish with commit list, measured rate, remaining limitations and resume status.
Do not push. The student should be able to explain one request, one session,
one concurrent update and one recovered checkpoint from their actual source.

## Ownership

- java-builder: docs/server.md and documentation fixes only; report any code repair to the orchestrator for logging and rescoping.
- test-builder: review existing coverage; add no redundant test for documentation.
- verifier: new evidence/step-10/attempt-N/ files; no code or log edits.
- orchestrator: log.md, diff review, explicit staging and the local commit.

## Required gate and checkpoint

```bash
mvn -B verify
git diff --check -- . ':(exclude,glob)evidence/**/*.txt'
```

Require actual passing assertions, zero failures/errors, zero skipped tests and
the observations specified above. Record command exits and Surefire counts,
not only Maven's final banner. The full suite protects every earlier feature.
Save evidence and follow workflow/checkpoints.md. Intended commit message:

```text
step-10: document and verify final server
```

Stop on a failed gate, student interruption or the chosen STOP_AFTER boundary.
