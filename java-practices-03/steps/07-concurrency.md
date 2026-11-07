# Step 07 — Run overlapping handlers with bounded admission

Dependency: 06. Begin only after earlier steps have verified local commits.
The interfaces and expected behavior in contracts/ are specifications to build.

## Build logic and verification cases

Replace the single-thread executor with an owned
Executors.newVirtualThreadPerTaskExecutor(). Wrap routing in AdmissionHandler
using a Semaphore with default 32 permits. tryAcquire either admits immediately
or responds 503 Busy. Every acquired permit is released exactly once in finally,
including failure. Do not release after a failed acquisition. This limits
application work, not all connections, memory or virtual-thread creation.

ConcurrencyTest proves overlap with injected handler coordination: request A
enters and waits on a bounded latch, request B must enter before A is released.
Always release test gates in finally so failed assertions cannot hang the suite.
Do not use elapsed speed or Thread.sleep as the proof. Then seed one HTTP
session, issue 200 concurrent successful requests with that exact cookie, and
check unique response counts 2..201 plus a final 202. An independent cookie's
count is unaffected. Use client concurrency below the admission cap here.

AdmissionTest sets the cap to 2 in a test configuration. Hold exactly two
delegates in-flight using latches, confirm a third receives 503, release the
holders and confirm a later request succeeds. Inspect the maximum observed
in-flight delegate count. Do not add a public sleep/test endpoint to the server.
Close test clients, servers and workers on every path.

Record that virtual threads change scheduling, whereas SessionStore protects
shared state. Neither mechanism replaces the other. Throughput measurement
is Step 09, separate from these deterministic correctness assertions.

## Ownership

- java-builder: the production classes required for this step under src/main/java/edu/algebra/http/.
- test-builder: src/test/java/edu/algebra/http/ for ConcurrencyTest,AdmissionTest.
- verifier: new evidence/step-07/attempt-N/ files; no code or log edits.
- orchestrator: log.md, diff review, explicit staging and the local commit.

## Required gate and checkpoint

```bash
mvn -B -Dtest=ConcurrencyTest,AdmissionTest verify
mvn -B verify
```

Require actual passing assertions, zero failures/errors, zero skipped tests and
the observations specified above. Record command exits and Surefire counts,
not only Maven's final banner. The full suite protects every earlier feature.
Save evidence and follow workflow/checkpoints.md. Intended commit message:

```text
step-07: bound concurrent request work
```

Stop on a failed gate, student interruption or the chosen STOP_AFTER boundary.
