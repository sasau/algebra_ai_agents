# Work orchestration

Java feature and concurrency concept: Callable, ExecutorService, Future, bounded queues and cancellation.

A console price aggregator requests three independent simulated shop quotes, with values 1200, 1800 and 2400 cents. A pool of two workers collects every result. A separate queue example transfers A, B and C through capacity two. No external service or API key is needed.

Start with the supplied [feature plan](../plans/03-orchestration.md). Send one prompt per turn. Each implementation step includes its focused unit test. Build the step, inspect the diff, validate with unit tests, run the feature, then ask the explainer for the detailed HTML view. Main-program output illustrates behaviour; JUnit assertions validate the build.

## 1. Read the supplied feature plan

```text
Read plans/03-orchestration.md with java-concurrency-tutor. Confirm only the next implementation step, its OrchestrationTest acceptance check and expected observation. Use the supplied plan; do not build the entire feature or regenerate a project plan. Stop before editing.
```

## 2. Collect the quote results

```text
Use java-concurrency-tutor. Add Orchestration.quoteTotal() and the orchestration route in workspace. Submit three simulated quotes 1200, 1800, 2400 cents with a two-worker ExecutorService, timed invokeAll and Future.get. Fail on cancellation, propagate task exceptions, and close the executor. Explain why submit is not completion. Do not add queue code or run yet. Include focused JUnit checks in OrchestrationTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=OrchestrationTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## 3. Add backpressure separately

```text
Use java-concurrency-tutor. Add Orchestration.boundedQueue(): prefill capacity-two ArrayBlockingQueue with A,B; a producer attempts put(C); the consumer takes A, awaits the producer Future and drains B,C. Use a latch to signal producer progress and cancel it in finally if needed. Explain why a latch before put does not prove the producer is already blocked. Do not run yet. Include focused JUnit checks in OrchestrationTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=OrchestrationTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## 4. Test failures and cancellation

```text
Use java-concurrency-tutor. Add bounded tests for total 5400, FIFO A/B/C, an IOException surfaced through ExecutionException, and cancel(true) interrupting a task waiting on a latch. Await executor termination and release resources in finally. Never swallow an interruption. Do not run yet. Include focused JUnit checks in OrchestrationTest. Print the concept, setup, execution, actual expected/observed values and reasons for assertions; use a JUnit watcher for the final PASS/FAIL. Explain source and cleanup in detail. Do not execute yet. Exercise Orchestration.collectQuotes(List<Callable<Integer>>, Duration) with injected failure and a latch-blocked task to test the real aggregator deadline.
```

Inspect the files, then validate the current step with the [unit-test execution prompt](../prompts/02-observe.md):

```sh
cd workspace
mvn -B -Dtest=OrchestrationTest verify
```

Read the CONCEPT, SETUP, EXECUTE, ASSERT, WHY and final verdict in the actual console output. A missing test class, zero tests, failure, error or skip does not validate the step. After the reviewer verifies the build and runs the feature, use the [Claude HTML explanation prompt](../prompts/01-explain.md). Open the generated HTML and inspect its diagrams before adding another feature.

## Detailed validation: Outcomes, deadline and cancellation

Collect three quotes; transfer A/B/C; inject a failing shop and an interruptible waiting shop.

- The real aggregator returns 5,400 and the queue transfers A/B/C in order.
- The aggregator propagates the original IOException through ExecutionException.
- A batch deadline cancels unfinished work; cancel(true) is followed by an observed worker response and executor termination.

Every check prints its required value and the actual captured result, then runs a real JUnit assertion. The watcher prints PASS only after JUnit succeeds, or FAIL with the cause after a failed assertion or timeout. Concurrency traces may interleave; do not compare the entire console transcript as a fixed fixture.

## Validate the completed lesson, then demonstrate

From the practice root:

```sh
cd workspace
mvn -B -Dtest=OrchestrationTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar orchestration
```

## Interpret the evidence

Total is 5400 cents and transferred order is [A, B, C]. Failure and cancellation tests check their own evidence. A fixed worker pool bounds active workers but its default queue is unbounded; production admission needs an explicit bound.

Use the [review prompt](../prompts/03-review.md). After a [focused repair](../prompts/04-repair.md), explain the diff and rerun the unit tests; the previous observations are stale.
