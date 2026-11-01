# Quote aggregation

## Java problem and desired behaviour

Collect every independent shop outcome before returning one total.

## Copy and run

```text
Read classroom/04-quotes.md. Use the Java specialist to build only this step
in workspace, including its narrated JUnit tests. Run the tests and the
current example. Stop after this feature.
```

## Build requirements

Target Java 21, no preview APIs, package edu.algebra.concurrency. Work only
in workspace; preserve earlier features and do not copy the completed reference.
Use the supplied tutor to build this one step and reviewer to validate/run it.
The detailed role instructions are already supplied; do not explain the agent
workflow. Explain the Java result briefly after execution. Unit-test console
narration remains detailed: concept, setup, actual expected/observed assertions,
reasons, limits and a watcher-reported verdict. Real JUnit assertions determine
success. Keep Surefire console output and failIfNoTests=true. Do not use sleep
for coordination or assert relative timings or global event order.

Add Orchestration.collectQuotes(List<Callable<Integer>>, Duration): reject
empty inputs and nonpositive deadline; use a fixed platform pool of two and timed
invokeAll. For each Future detect cancellation and throw TimeoutException;
otherwise get the value so failures propagate through ExecutionException. Return
the total only after every required result succeeds. Close the executor; tasks
must cooperate with interruption. quoteTotal supplies three simulated shops with
values 1200, 1800, 2400 cents. Add Main orchestration showing cents only. Add the
OrchestrationTest total 5400 assertion. Leave queue and extended failure tests
for their own classroom step. No real external service is called.

## Validation and run

From workspace:

```sh
mvn -B -Dtest=OrchestrationTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar orchestration
```

Expected interpretation: Three successful quotes produce 5400 cents; no partial total is accepted.

Afterward, identify the Java feature and concurrency guarantee shown by the actual output.
