# Feature plan — Work orchestration

## Feature and inputs

A console price aggregator requests three independent simulated shop quotes, with values 1200, 1800 and 2400 cents. A pool of two workers collects every result. A separate queue example transfers A, B and C through capacity two. No external service or API key is needed.

## Java and concurrency mechanism

Callable, ExecutorService, Future, bounded queues and cancellation.

## Implementation steps

1. **Collect the quote results.** Implement only this step and its focused tests.
2. **Add backpressure separately.** Implement only this step and its focused tests.
3. **Test failures and cancellation.** Implement only this step and its focused tests.

The tutor builds one step. The reviewer validates `OrchestrationTest` and runs the feature. The explainer then reads source and evidence, draws the mechanism and creates `workspace/explanation/project.html`. Open and inspect that result before advancing.

## Unit-test acceptance

Collect three quotes; transfer A/B/C; inject a failing shop and an interruptible waiting shop.

- The real aggregator returns 5,400 and the queue transfers A/B/C in order.
- The aggregator propagates the original IOException through ExecutionException.
- A batch deadline cancels unfinished work; cancel(true) is followed by an observed worker response and executor termination.

## Commands after a build

```sh
mvn -B -Dtest=OrchestrationTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar orchestration
```

## Expected interpretation

Total is 5400 cents and transferred order is [A, B, C]. Failure and cancellation tests check their own evidence. A fixed worker pool bounds active workers but its default queue is unbounded; production admission needs an explicit bound.
