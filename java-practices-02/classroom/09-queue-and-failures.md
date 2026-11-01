# Bounded handoff and exceptional outcomes

## Java problem and desired behaviour

Add backpressure and exercise the real aggregator failure/cancellation paths.

## Copy and run

```text
Read classroom/09-queue-and-failures.md. Use the Java specialist to build only this step
in workspace, including its narrated JUnit tests. Run the tests and the
current example. Stop after this feature.
```

## Build requirements

Target Java 21, no preview APIs, package edu.algebra.concurrency. Work only
in workspace; preserve earlier features and do not copy the completed reference.
Use the supplied tutor to build this one step and reviewer to validate/run it.
The detailed role instructions are already supplied; do not explain the agent
workflow. Explain the Java result briefly after execution. Unit-test console
narration remains detailed: concept, setup, actual expected/observed assertions,
reasons, limits and a watcher-reported verdict. Real JUnit assertions determine
success. Keep Surefire console output and failIfNoTests=true. Do not use sleep
for coordination or assert relative timings or global event order.

Extend existing Orchestration with boundedQueue(): prefill an ArrayBlockingQueue
of capacity two with A, B. A producer signals a latch before attempting put(C).
Consumer takes A, awaits the producer Future, then drains B, C. Cancel producer in
finally if needed and close its executor. Explain that the latch proves progress
to put, not the exact instant of blocking. Main orchestration now also prints
queue [A, B, C]. Extend OrchestrationTest to the completed five checks: total 5400,
FIFO transfer, original IOException surfaced through ExecutionException from
collectQuotes, injected interruptible waiting quote cancelled by batch deadline,
and explicit cooperative cancel(true) followed by observed response/termination.
Use latches and bounded waits, not arbitrary sleeps as synchronization.

## Validation and run

From workspace:

```sh
mvn -B -Dtest=OrchestrationTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar orchestration
```

Expected interpretation: 5400 cents, FIFO[A,B,C], propagated failure and observed deadline/cancellation cleanup.

Afterward, identify the Java feature and concurrency guarantee shown by the actual output.
