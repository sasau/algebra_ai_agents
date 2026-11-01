# Monitor and atomic counter

## Java problem and desired behaviour

Protect the complete increment while keeping the same work.

## Copy and run

```text
Read classroom/03-counter-repairs.md. Use the Java specialist to build only this step
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

Preserve forcedLostUpdate. Add Races.safeIncrements(boolean atomic,
int perWorker): two workers each perform perWorker increments. One variant uses
a synchronized method on the same counter monitor; the other uses AtomicInteger
incrementAndGet. Collect outcomes and clean up. Extend Main races with perWorker
1000. Extend SharedStateTest with one test per repair using perWorker 10000,
requiring 20000 for both. Explain why volatile visibility alone does not make
count++ atomic. Do not add unrelated concurrency features.

## Validation and run

From workspace:

```sh
mvn -B -Dtest=SharedStateTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar races
```

Expected interpretation: Main prints1/2000/2000; larger tests require1/20000/20000.

Afterward, identify the Java feature and concurrency guarantee shown by the actual output.
