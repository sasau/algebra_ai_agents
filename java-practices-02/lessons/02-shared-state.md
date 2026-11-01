# Shared state

Java feature and concurrency concept: interleaving, atomicity, visibility and mutual exclusion.

Two workers increment one shared counter. First force a lost update so that the failure is reproducible. Then change the protected operation while preserving the number of increments. Input is the chosen implementation; output is the observed final count.

Start with the supplied [feature plan](../plans/02-shared-state.md). Send one prompt per turn. Each implementation step includes its focused unit test. Build the step, inspect the diff, validate with unit tests, run the feature, then ask the explainer for the detailed HTML view. Main-program output illustrates behaviour; JUnit assertions validate the build.

## 1. Read the supplied feature plan

```text
Read plans/02-shared-state.md with java-concurrency-tutor. Confirm only the next implementation step, its SharedStateTest acceptance check and expected observation. Use the supplied plan; do not build the entire feature or regenerate a project plan. Stop before editing.
```

## 2. Force one lost update

```text
Use java-concurrency-tutor. In workspace add Races.forcedLostUpdate() using two platform workers, one volatile int and a timed CyclicBarrier between read and write. Join through Future.get, propagate errors and close the executor. Add the races route. Return actual final count; do not hardcode the observation. Do not add fixes or run yet. Include focused JUnit checks in SharedStateTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=SharedStateTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## 3. Protect the complete increment

```text
Use java-concurrency-tutor. Add Races.safeIncrements(boolean atomic, int perWorker). Compare a synchronized monitor method with AtomicInteger.incrementAndGet using two workers and identical work. Add result lines to the races route. Explain each atomicity boundary. Do not use volatile as the fix. Do not run yet. Include focused JUnit checks in SharedStateTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=SharedStateTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## 4. Test the forced schedule and repairs

```text
Use java-concurrency-tutor. Add bounded JUnit tests: forcedLostUpdate is 1; synchronized and atomic variants each produce 20000 for two workers doing 10000 increments. Do not require random scheduling to expose the defect and do not use Thread.sleep for coordination. Do not run yet. Include focused JUnit checks in SharedStateTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=SharedStateTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## Detailed validation: Atomicity and visibility

A barrier forces both unsafe reads before either write. Two repaired variants each perform 20,000 increments.

- The deliberately unsafe counter returns one, demonstrating the lost update.
- The monitor and AtomicInteger variants each return 20,000.
- The explanation identifies why volatile alone does not protect read-modify-write.

Every check prints its required value and the actual captured result, then runs a real JUnit assertion. The watcher prints PASS only after JUnit succeeds, or FAIL with the cause after a failed assertion or timeout. Concurrency traces may interleave; do not compare the entire console transcript as a fixed fixture.

## Validate the completed lesson, then demonstrate

From the practice root:

```sh
cd workspace
mvn -B -Dtest=SharedStateTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar races
```

## Interpret the evidence

Forced lost update is 1, not 2. The main repair examples each return 2000; tests with 10000 increments per worker return 20000. The barrier forces a bad read/write interleaving; the protected increment removes it.

Use the [review prompt](../prompts/03-review.md). After a [focused repair](../prompts/04-repair.md), explain the diff and rerun the unit tests; the previous observations are stale.
