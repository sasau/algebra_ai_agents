# Dining philosophers

Java feature and concurrency concept: resource ownership, circular wait, lock ordering and progress limits.

Five philosophers share five forks. Pi needs Fi and F(i+1)%5 to eat. First force all five to own their first fork, creating circular wait; then interrupt and join every worker. Next make all workers acquire the lower-numbered fork before the higher-numbered fork. Print actual state events and meal counts.

Start with the supplied [feature plan](../plans/05-dining-philosophers.md). Send one prompt per turn. Each implementation step includes its focused unit test. Build the step, inspect the diff, validate with unit tests, run the feature, then ask the explainer for the detailed HTML view. Main-program output illustrates behaviour; JUnit assertions validate the build.

## 1. Read the supplied feature plan

```text
Read plans/05-dining-philosophers.md with java-concurrency-tutor. Confirm only the next implementation step, its DiningPhilosophersTest acceptance check and expected observation. Use the supplied plan; do not build the entire feature or regenerate a project plan. Stop before editing.
```

## 2. Force and recover circular wait

```text
Use java-concurrency-tutor. Implement DiningPhilosophers.circularWait() in workspace using five platform workers, ReentrantLock.lockInterruptibly, latches and bounded waits. Force every philosopher to hold Fi before attempting F(i+1)%5. In finally interrupt all workers before joining any, and release each acquired lock. Return heldFirstForks and workersStopped. No uninterruptible intentional deadlock, Thread.stop or JVM-wide exit. Add the dining route. Do not run yet. Include focused JUnit checks in DiningPhilosophersTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=DiningPhilosophersTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## 3. Remove circular wait

```text
Use java-concurrency-tutor. Add DiningPhilosophers.ordered(rounds,virtual). Each task acquires min(left,right) then max(left,right) with lockInterruptibly and nested finally unlocks. Record HUNGRY/EATING/THINKING events from real state and per-philosopher meals; instrument fork ownership to detect conflicting eaters. Use a bounded batch deadline. Explain why P4 must take F0 before F4 and why this does not prove starvation freedom. Do not run yet. Include focused JUnit checks in DiningPhilosophersTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=DiningPhilosophersTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## 4. Verify safety and bounded completion

```text
Use java-concurrency-tutor. Test that the circular-wait demonstration reports five first forks held and all workers stopped; ordered dining on platform and virtual threads gives each philosopher four meals with no conflicting fork ownership. Do not assert a global event order or claim finite tests prove fairness. Bound the suite and inspect cleanup. Do not run yet. Include focused JUnit checks in DiningPhilosophersTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=DiningPhilosophersTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## Detailed validation: Exclusive forks and bounded progress

Force five first forks, recover every worker, then run ordered dining on platform and virtual threads.

- The circular-wait snapshot has five first forks and every worker stops.
- Every philosopher completes four meals; all twenty actual eating events are retained.
- Fork ownership assertions detect conflicts, but finite runs do not prove starvation freedom.

Every check prints its required value and the actual captured result, then runs a real JUnit assertion. The watcher prints PASS only after JUnit succeeds, or FAIL with the cause after a failed assertion or timeout. Concurrency traces may interleave; do not compare the entire console transcript as a fixed fixture.

## Validate the completed lesson, then demonstrate

From the practice root:

```sh
cd workspace
mvn -B -Dtest=DiningPhilosophersTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar dining
```

## Interpret the evidence

The recoverable snapshot reports five first forks and workersStopped=true. The main ordered run gives [3, 3, 3, 3, 3]; tests use four meals each. Event order may vary. Global lock order prevents a wait cycle; finite successful runs do not establish starvation freedom.

Use the [review prompt](../prompts/03-review.md). After a [focused repair](../prompts/04-repair.md), explain the diff and rerun the unit tests; the previous observations are stale.
