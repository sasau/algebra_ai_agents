# Feature plan — Platform and virtual threads

## Feature and inputs

The same console workload runner executes numbered tasks in four modes: sequential, platform pool of eight, platform thread per task, virtual thread per task. A blocking workload sleeps to model waiting. A separate CPU workload computes and returns a checksum. Output includes actual elapsed times and completed work.

## Java and concurrency mechanism

task-per-thread execution, waiting, CPU limits and measurement.

## Implementation steps

1. **Build the workload runner.** Implement only this step and its focused tests.
2. **Test equal work before measuring.** Implement only this step and its focused tests.
3. **Add the measurement command.** Implement only this step and its focused tests.

The tutor builds one step. The reviewer validates `ThreadComparisonTest` and runs the feature. The explainer then reads source and evidence, draws the mechanism and creates `workspace/explanation/project.html`. Open and inspect that result before advancing.

## Unit-test acceptance

Run identical blocking and CPU task bodies in all four modes, then apply a separate two-permit resource limit.

- Every mode returns every task and an equal checksum for each workload.
- Actual isVirtual observations match the chosen strategy.
- The scarce resource admits at most two tasks; elapsed time has no speed threshold.

## Commands after a build

```sh
mvn -B -Dtest=ThreadComparisonTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar compare 120 20 5
```

## Expected interpretation

Every mode completes the same task count and checksum per workload. Virtual mode reports all tasks virtual when invoked from the normal Main. Record actual medians; there is no required speedup. Pool-of-eight measures an admission choice, so include platform-per-task too. Sleep is simulated waiting, not proof about a real network.
