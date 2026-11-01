# Platform and virtual threads

Java feature and concurrency concept: task-per-thread execution, waiting, CPU limits and measurement.

The same console workload runner executes numbered tasks in four modes: sequential, platform pool of eight, platform thread per task, virtual thread per task. A blocking workload sleeps to model waiting. A separate CPU workload computes and returns a checksum. Output includes actual elapsed times and completed work.

Start with the supplied [feature plan](../plans/04-thread-comparison.md). Send one prompt per turn. Each implementation step includes its focused unit test. Build the step, inspect the diff, validate with unit tests, run the feature, then ask the explainer for the detailed HTML view. Main-program output illustrates behaviour; JUnit assertions validate the build.

## 1. Read the supplied feature plan

```text
Read plans/04-thread-comparison.md with java-concurrency-tutor. Confirm only the next implementation step, its ThreadComparisonTest acceptance check and expected observation. Use the supplied plan; do not build the entire feature or regenerate a project plan. Stop before editing.
```

## 2. Build the workload runner

```text
Use java-concurrency-tutor. Implement Workloads.run(mode,kind,tasks,waitMillis,cpuIterations,parallelism,resourceLimit) in workspace. Return completed count, checksum, virtual-task count, peak active work and elapsed nanoseconds. Use Java 21 stable APIs, a 15-second batch deadline and interruptible cleanup. Bound tasks to 256 and validate work sizes. Add a Semaphore for optional resourceLimit; zero means no extra limit. Do not add benchmarks or run yet. Include focused JUnit checks in ThreadComparisonTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=ThreadComparisonTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## 3. Test equal work before measuring

```text
Use java-concurrency-tutor. Add tests for equal completed count and checksum in all four modes for blocking and CPU work; assert isVirtual observations match the chosen mode; assert a two-permit resource limit never has peakActive above two. Use small workloads. Do not assert relative timings or exact log order. Do not run yet. Include focused JUnit checks in ThreadComparisonTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=ThreadComparisonTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## 4. Add the measurement command

```text
Use java-concurrency-tutor. Add Main compare [tasks] [waitMillis] [rounds]. Defaults are 120,20,5. For each workload use three warmup rounds and five measured rounds, rotate mode order, verify equal work, record each elapsed time and report medians. Print JDK, OS, architecture, cores and inputs. Include startup, completion and cleanup; no printing inside the timer. Treat this as an elapsed-time teaching experiment rather than a JMH benchmark. Do not run yet. Include focused JUnit checks in ThreadComparisonTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=ThreadComparisonTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## Detailed validation: Equal work across thread strategies

Run identical blocking and CPU task bodies in all four modes, then apply a separate two-permit resource limit.

- Every mode returns every task and an equal checksum for each workload.
- Actual isVirtual observations match the chosen strategy.
- The scarce resource admits at most two tasks; elapsed time has no speed threshold.

Every check prints its required value and the actual captured result, then runs a real JUnit assertion. The watcher prints PASS only after JUnit succeeds, or FAIL with the cause after a failed assertion or timeout. Concurrency traces may interleave; do not compare the entire console transcript as a fixed fixture.

## Validate the completed lesson, then demonstrate

From the practice root:

```sh
cd workspace
mvn -B -Dtest=ThreadComparisonTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar compare 120 20 5
```

## Interpret the evidence

Every mode completes the same task count and checksum per workload. Virtual mode reports all tasks virtual when invoked from the normal Main. Record actual medians; there is no required speedup. Pool-of-eight measures an admission choice, so include platform-per-task too. Sleep is simulated waiting, not proof about a real network.

Use the [review prompt](../prompts/03-review.md). After a [focused repair](../prompts/04-repair.md), explain the diff and rerun the unit tests; the previous observations are stale.
