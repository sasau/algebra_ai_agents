# Thread lifecycle

## Java problem and desired behaviour

Return the executing worker name after completion, then contrast a direct run call.

## Copy and run

```text
Read classroom/01-lifecycle.md. Use the Java specialist to build only this step
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

Implement Lifecycle.startAndJoin(): a platform worker named lesson-worker
records Thread.currentThread().getName() into an AtomicReference; caller starts,
joins, then returns it. Implement Lifecycle.directRun() using a separate unstarted
platform Thread and a direct run() call, returning the actual caller name.
Add Main lifecycle route and Main-Class executable-JAR manifest. Comments explain
execution ownership and join completion/visibility; AtomicReference has separate
visibility semantics. Plain join has no runtime deadline.

Add LifecycleTest and reusable LessonConsole JUnit extension. Assert worker name
lesson-worker and directRun equal to the test caller's current name. Use a suite
timeout as a stuck-test guard. Do not require main as a fixed test caller name.

## Validation and run

From workspace:

```sh
mvn -B -Dtest=LifecycleTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar lifecycle
```

Expected interpretation: Worker lesson-worker; direct caller main when launched from Main.

Afterward, identify the Java feature and concurrency guarantee shown by the actual output.
