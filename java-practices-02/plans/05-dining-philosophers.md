# Feature plan — Dining philosophers

## Feature and inputs

Five philosophers share five forks. Pi needs Fi and F(i+1)%5 to eat. First force all five to own their first fork, creating circular wait; then interrupt and join every worker. Next make all workers acquire the lower-numbered fork before the higher-numbered fork. Print actual state events and meal counts.

## Java and concurrency mechanism

resource ownership, circular wait, lock ordering and progress limits.

## Implementation steps

1. **Force and recover circular wait.** Implement only this step and its focused tests.
2. **Remove circular wait.** Implement only this step and its focused tests.
3. **Verify safety and bounded completion.** Implement only this step and its focused tests.

The tutor builds one step. The reviewer validates `DiningPhilosophersTest` and runs the feature. The explainer then reads source and evidence, draws the mechanism and creates `workspace/explanation/project.html`. Open and inspect that result before advancing.

## Unit-test acceptance

Force five first forks, recover every worker, then run ordered dining on platform and virtual threads.

- The circular-wait snapshot has five first forks and every worker stops.
- Every philosopher completes four meals; all twenty actual eating events are retained.
- Fork ownership assertions detect conflicts, but finite runs do not prove starvation freedom.

## Commands after a build

```sh
mvn -B -Dtest=DiningPhilosophersTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar dining
```

## Expected interpretation

The recoverable snapshot reports five first forks and workersStopped=true. The main ordered run gives [3, 3, 3, 3, 3]; tests use four meals each. Event order may vary. Global lock order prevents a wait cycle; finite successful runs do not establish starvation freedom.
