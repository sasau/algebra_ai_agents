# Measured thread comparison

## Java problem and desired behaviour

Observe elapsed time only after the runner passes its correctness checks.

## Copy and run

```text
Read classroom/06-measurements.md. Use the Java specialist to build only this step
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

Preserve the tested runner. Add Main compare [tasks] [waitMillis] [rounds]
with defaults 120, 20, 5. Compare all four strategies for BLOCKING and CPU workloads;
use 50000 CPU iterations, pool 8 and resourceLimit 0. Three warmup rounds, then
five measured rounds by default; allow 3/5/7/9 measured rounds and rotate strategy
order. Check equal completed counts/checksums before accepting each sample.
Print actual JDK/OS/architecture/processor metadata and inputs, complete sample
rows and medians. Keep explanations/printing outside the timer. State that sleep
simulates waiting, no memory is measured, and CPU work has intentional identical
signed-long overflow. Do not add speed assertions or fabricate observations.

## Validation and run

From workspace:

```sh
mvn -B -Dtest=ThreadComparisonTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar compare 120 20 5
```

Expected interpretation: Every mode completes 120 equal tasks; medians are actual observations with no required ranking.

Afterward, identify the Java feature and concurrency guarantee shown by the actual output.
