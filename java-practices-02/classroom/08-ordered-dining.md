# Global lock order

## Java problem and desired behaviour

Remove circular wait while retaining exclusive fork ownership.

## Copy and run

```text
Read classroom/08-ordered-dining.md. Use the Java specialist to build only this step
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

Preserve circularWait. Add DiningPhilosophers.ordered(rounds,virtual): every
worker acquires min(left,right) then max(left,right) using lockInterruptibly and
nested finally unlocks. P4 therefore takes F0 before F4. Record actual HUNGRY,
EATING,THINKING events and meal counts. Instrument exclusive ownership of both
forks while eating; conflicting use must fail through task outcomes. Bound batch
completion and clean up cooperatively. Main dining runs three meals using virtual
threads after the recovered failure; print actual events and counts. Extend tests
to four meals per philosopher on both platform and virtual threads and reject
invalid rounds. Assert no exact global event order or starvation-freedom claim.

## Validation and run

From workspace:

```sh
mvn -B -Dtest=DiningPhilosophersTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar dining
```

Expected interpretation: Main meals[3,3,3,3,3]; tests check four meals each for both strategies and exclusive forks.

Afterward, identify the Java feature and concurrency guarantee shown by the actual output.
