# Narrated JUnit validation

Every implemented step has a real unit-test acceptance check before it advances.
Run its focused class, then demonstrate Main. Use the complete suite at the end.

```sh
cd workspace
mvn -B -Dtest=LifecycleTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar lifecycle
```

Use reference instead of workspace for instructor validation. Its full suite
has16 tests. Student counts grow with implemented scope; do not add passing
placeholders for unimplemented features.

| Class | Tests | What the completed checks establish |
|---|---:|---|
| LifecycleTest |1| Started worker reports its name; direct run reports its caller |
| SharedStateTest |3| Barrier forces lost update to1; monitor and atomic variants each return20,000 |
| OrchestrationTest |5| Total5400, FIFO A/B/C, real aggregator propagates IOException, deadline cancellation, cooperative cancel and termination |
| ThreadComparisonTest |4| Equal work/checksums for blocking and CPU across four modes, actual thread types, semaphore peak at most 2, invalid sizes rejected |
| DiningPhilosophersTest |3| Five first forks then all workers stop; both thread strategies complete four meals each with exclusive forks; invalid meal counts rejected |

## Read each test as a worked experiment

LessonConsole is a JUnit extension. Before each test it prints its name and
environment. The test narrates setup, captures returned values, prints
expected/observed pairs and invokes actual JUnit assertions. TestWatcher prints
PASS only after success; timeout or assertion failure prints FAIL and its cause.
An abort is NOT VERIFIED. Printed text cannot replace the assertion verdict.

Actual completed-reference lifecycle excerpt on Java21.0.10:

```text
[EXECUTE] Call startAndJoin; join waits for termination before the caller reads the result.
[ASSERT] executing worker name: expected=lesson-worker; observed=lesson-worker
[WHY] The name is obtained inside the task, so it identifies the thread that actually executed it.
[EXECUTE] Call directRun from main; no new thread is started.
[ASSERT] direct-call thread name: expected=main; observed=main
```

This establishes the execution paths exercised. It promises no print order or
universal scheduling behaviour. Join establishes completion and visibility;
AtomicReference also provides atomic publication. The test timeout guards a
stuck suite and is not a runtime latency promise. Plain join has no deadline.

Failure tests inspect the actual exception and original cause, observe the
worker's interruption response and await executor termination. A cancelled
Future alone does not prove its worker stopped. Dining prints actual recorded
events; assertions check ownership and meals rather than a fixed global event
order. Finite completion does not prove indefinite fairness.

## Preserve the validation gate

Surefire has failIfNoTests=true, console output enabled, full stack traces and
alphabetical class order. Missing focused classes and zero-test empty projects
fail normal verify. Skipping tests is permitted for bootstrap packaging only,
labelled TESTS NOT RUN. Inspect Maven's real exit status and test totals; do not
hide its failure status behind a shell pipeline.

Bootstrap refuses a nonempty destination without replacing files. It creates no
classes, tests or executable manifest. The first tutor build must supply both
implementation and focused test before normal verify can validate a feature.

## Optional detailed reference after the run

Give the explainer the plan, current source/tests, fresh
target/surefire-reports/TEST-*.xml and actual stdout/stderr with exit statuses.
Ask for workspace/explanation/project.html with annotated source,
expected/observed checks, native SVG and limitations. Use it for additional reading. After repair,
previous reports describe old source; rerun tests/Main. Refresh any optional page if retained.

Equality and resource bounds are correctness assertions. Elapsed samples are
measurements with no required virtual-thread speedup. Simulated waiting,
finite runs and the absence of memory data limit performance conclusions.
