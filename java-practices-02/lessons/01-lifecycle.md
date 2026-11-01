# Thread lifecycle

Java feature and concurrency concept: start, run, join and happens-before.

A console learner asks which thread executed a task. Input is the selected lifecycle case. Output names the actual executing thread. The application is a normal JVM process; Claude helps write it during development.

Start with the supplied [feature plan](../plans/01-lifecycle.md). Send one prompt per turn. Each implementation step includes its focused unit test. Build the step, inspect the diff, validate with unit tests, run the feature, then ask the explainer for the detailed HTML view. Main-program output illustrates behaviour; JUnit assertions validate the build.

## 1. Read the supplied feature plan

```text
Read plans/01-lifecycle.md with java-concurrency-tutor. Confirm only the next implementation step, its LifecycleTest acceptance check and expected observation. Use the supplied plan; do not build the entire feature or regenerate a project plan. Stop before editing.
```

## 2. Build one worker

```text
Use java-concurrency-tutor. In workspace implement only Lifecycle.startAndJoin(), a platform thread named lesson-worker, and a Main lifecycle route in package edu.algebra.concurrency. Add a Main-Class JAR manifest. Return the actual worker name after join. Add comments explaining start and join. Do not add directRun and do not run yet. Include focused JUnit checks in LifecycleTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=LifecycleTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## 3. Add the direct-call comparison

```text
Use java-concurrency-tutor. Add only Lifecycle.directRun() and print its actual executing thread name in the lifecycle route. Explain why worker.run() stays on the caller. Preserve startAndJoin. Do not run yet. Include focused JUnit checks in LifecycleTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=LifecycleTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## 4. Review and complete lifecycle tests

```text
Use java-concurrency-tutor. Add JUnit tests asserting startAndJoin returns lesson-worker and directRun returns Thread.currentThread().getName(). Explain the completion and visibility guarantee of join. No sleep-based ordering and no exact scheduling assertions. Do not run yet. Include focused JUnit checks in LifecycleTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=LifecycleTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## Detailed validation: Thread ownership and completion

A named worker records its actual thread name; a separate direct call records its caller.

- The started worker reports lesson-worker after join returns.
- The direct call reports Thread.currentThread().getName() from its caller.
- No assertion assumes a particular print order or uses sleep to coordinate.

Every check prints its required value and the actual captured result, then runs a real JUnit assertion. The watcher prints PASS only after JUnit succeeds, or FAIL with the cause after a failed assertion or timeout. Concurrency traces may interleave; do not compare the entire console transcript as a fixed fixture.

## Validate the completed lesson, then demonstrate

From the practice root:

```sh
cd workspace
mvn -B -Dtest=LifecycleTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar lifecycle
```

## Interpret the evidence

The worker result is lesson-worker. A direct run from Main reports main. A test compares the direct-run result with its current caller name. Both paths complete; join establishes completion and visibility.

Use the [review prompt](../prompts/03-review.md). After a [focused repair](../prompts/04-repair.md), explain the diff and rerun the unit tests; the previous observations are stale.
