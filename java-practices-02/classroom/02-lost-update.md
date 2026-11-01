# Forced lost update

## Java problem and desired behaviour

Make two workers overwrite the same counter update in a reproducible interleaving.

## Copy and run

```text
Read classroom/02-lost-update.md. Use the Java specialist to build only this step
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

Add only Races.forcedLostUpdate(): two platform workers each read one shared
volatile int, initially zero. A timed CyclicBarrier after the reads prevents either
write until both have read zero. Each then writes its local snapshot plus one.
Collect actual task outcomes with Future.get, propagate failures and close the
executor. Return the observed final counter. Add Main races showing only this
implemented result. Add SharedStateTest requiring one after two attempted updates.
The test demonstrates the forced unsafe schedule; it does not declare the counter
safe. Do not add repaired variants yet.

## Validation and run

From workspace:

```sh
mvn -B -Dtest=SharedStateTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar races
```

Expected interpretation: The coordinated lost update returns 1; neither write order is required.

Afterward, identify the Java feature and concurrency guarantee shown by the actual output.
