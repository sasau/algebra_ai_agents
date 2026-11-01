# Recoverable circular wait

## Java problem and desired behaviour

Demonstrate an ownership cycle, then stop every worker cleanly.

## Copy and run

```text
Read classroom/07-circular-wait.md. Use the Java specialist to build only this step
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

Add DiningPhilosophers.circularWait() with five platform workers and five
ReentrantLocks. Pi requires Fi and F(i+1)%5. Each acquires Fi with lockInterruptibly;
coordinate all five first acquisitions before permitting second-fork attempts.
Record the first-fork ownership cycle rather than inferring deadlock from timeout.
Bound coordination waits. In finally interrupt every worker before joining any;
release only acquired locks and observe all stopped. Return heldFirstForks and
workersStopped. Main dining initially prints only the circular-wait result.
DiningPhilosophersTest requires five first forks and workersStopped=true.
Never use Thread.stop, an uninterruptible intentional deadlock or JVM exit.

## Validation and run

From workspace:

```sh
mvn -B -Dtest=DiningPhilosophersTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar dining
```

Expected interpretation: Five first forks held; all demonstration workers stopped after recovery.

Afterward, identify the Java feature and concurrency guarantee shown by the actual output.
