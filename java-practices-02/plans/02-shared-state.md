# Feature plan — Shared state

## Feature and inputs

Two workers increment one shared counter. First force a lost update so that the failure is reproducible. Then change the protected operation while preserving the number of increments. Input is the chosen implementation; output is the observed final count.

## Java and concurrency mechanism

interleaving, atomicity, visibility and mutual exclusion.

## Implementation steps

1. **Force one lost update.** Implement only this step and its focused tests.
2. **Protect the complete increment.** Implement only this step and its focused tests.
3. **Test the forced schedule and repairs.** Implement only this step and its focused tests.

The tutor builds one step. The reviewer validates `SharedStateTest` and runs the feature. The explainer then reads source and evidence, draws the mechanism and creates `workspace/explanation/project.html`. Open and inspect that result before advancing.

## Unit-test acceptance

A barrier forces both unsafe reads before either write. Two repaired variants each perform 20,000 increments.

- The deliberately unsafe counter returns one, demonstrating the lost update.
- The monitor and AtomicInteger variants each return 20,000.
- The explanation identifies why volatile alone does not protect read-modify-write.

## Commands after a build

```sh
mvn -B -Dtest=SharedStateTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar races
```

## Expected interpretation

Forced lost update is 1, not 2. The main repair examples each return 2000; tests with 10000 increments per worker return 20000. The barrier forces a bad read/write interleaving; the protected increment removes it.
