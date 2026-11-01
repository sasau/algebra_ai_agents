# Feature plan — Thread lifecycle

## Feature and inputs

A console learner asks which thread executed a task. Input is the selected lifecycle case. Output names the actual executing thread. The application is a normal JVM process; Claude helps write it during development.

## Java and concurrency mechanism

start, run, join and happens-before.

## Implementation steps

1. **Build one worker.** Implement only this step and its focused tests.
2. **Add the direct-call comparison.** Implement only this step and its focused tests.
3. **Review and complete lifecycle tests.** Implement only this step and its focused tests.

The tutor builds one step. The reviewer validates `LifecycleTest` and runs the feature. The explainer then reads source and evidence, draws the mechanism and creates `workspace/explanation/project.html`. Open and inspect that result before advancing.

## Unit-test acceptance

A named worker records its actual thread name; a separate direct call records its caller.

- The started worker reports lesson-worker after join returns.
- The direct call reports Thread.currentThread().getName() from its caller.
- No assertion assumes a particular print order or uses sleep to coordinate.

## Commands after a build

```sh
mvn -B -Dtest=LifecycleTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar lifecycle
```

## Expected interpretation

The worker result is lesson-worker. A direct run from Main reports main. A test compares the direct-run result with its current caller name. Both paths complete; join establishes completion and visibility.
