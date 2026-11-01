# Equal-work execution strategies

## Java problem and desired behaviour

Run identical tasks in four modes before introducing measurement interpretation.

## Copy and run

```text
Read classroom/05-workloads.md. Use the Java specialist to build only this step
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

Implement Workloads with modes SEQUENTIAL, PLATFORM_POOL, PLATFORM_PER_TASK,
VIRTUAL_PER_TASK and kinds BLOCKING,CPU. run(mode,kind,tasks,waitMillis,
cpuIterations,parallelism,resourceLimit) returns completed count, checksum,
actual virtual task count, peak active resource use and elapsed nanos. Preserve
one task body across all strategies. Bound tasks to 256, validate work sizes and
limit sequential wait to ten seconds per batch. Use a fifteen-second batch deadline
and cooperative cleanup. Resource limit zero disables an extra bound; positive
limits use a Semaphore with acquire/finally release. Include executor creation,
completion and cleanup in the timer; exclude job-list preparation and printing.

ThreadComparisonTest uses small inputs: equal counts/checksums for blocking and
CPU work in all four modes; actual isVirtual observations; twenty virtual tasks
with a two-permit peak bound; invalid task sizes rejected. No timing threshold.
This step runs JUnit only. The compare Main route comes next.

## Validation and run

From workspace:

```sh
mvn -B -Dtest=ThreadComparisonTest verify
```

Expected interpretation: Equal completed work/checksums, correct actual thread types, peak resource use at most 2.

Afterward, identify the Java feature and concurrency guarantee shown by the actual output.
