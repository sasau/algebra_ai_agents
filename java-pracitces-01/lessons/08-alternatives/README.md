# case08 — or — try a second Optional-producing source

**Guided follow-up**. This page is the complete sequence;
there is no separate brief to hand to Claude. Send one prompt, inspect the result,
then continue. All examples are independent packages in the same Maven project.

## Understand the Java operation

or keeps the current Optional when present and calls an alternative supplier only when empty. Unlike orElseGet, the supplier returns Optional<T>, so the result remains Optional. This fits a cache lookup followed by a database lookup without introducing a default value before all sources have been tried.

Use fresh in-memory cache/database sources for cache hit, database hit and both missing.

```java
// both sources return Optional<String>
return cache.get().or(database);
```

This is an explanatory excerpt. The full implementation uses public methods and a
main in `edu.algebra.optional.case08alternatives`. 

## 1. Build an informative example

```text
Use java-tutor to build case08 in edu.algebra.optional.case08alternatives; follow our build stage.
Implement resolve(Supplier<Optional<String>>, Supplier<Optional<String>>) with cache.get().or(database).
Use fresh in-memory cache/database sources for cache hit, database hit and both missing.
Make main informative: System.out shows inputs, operations and outcomes from real method calls.
RESULT labels: cache-hit, database-hit, missing.
Use source values cache Ada and db Ada. Append ; dbCalls=<count> to hit lines only.
Wire the case into app.Main and --list; preserve fixed observations.
Preserve prior cases. Package only; do not launch the JAR or read expected/reference code.
```

Inspect the small plan, methods and console statements. Compilation is the result
of this stage; the main has not been run. The RESULT prefix identifies stable
observations for later checks; ordinary explanatory text remains free to improve.

## 2. Update the code with explanations

```text
Use java-tutor to annotate case08; follow our explanation stage.
Explain why or stays Optional<String> and why the database supplier is skipped for a cache hit.
Add concise JavaDoc/comments and improve explanatory stdout without changing RESULT lines.
Explain the types, the empty path and one pitfall. Show the excerpt; do not run it yet.
```

Read the comments. Verify that they explain types, empty paths and evaluation,
not only repeat the method names. A comment is an explanation, not execution evidence.

## 3. Predict and run it yourself

Predict database calls for each source combination and whether the final result is still Optional.

```bash
./mvnw -q clean package -DskipTests
java -jar target/optional-lab.jar case08
```

Read the terminal output before asking Claude to explain it. After the tool step,
you may also run `python3 tools/run_case.py case08 --observe` directly. The wrapper
must rebuild after source/narration changes so the JAR reflects current code.

## 4. Ask Claude to run and trace the output

```text
Use /run-optional-case case08 for the observation stage.
Rebuild and run the actual JAR; read stdout, stderr and exit code.
Map important output lines to the producing code and explain the Optional behaviour.
Focus: Explain why or stays Optional<String> and why the database supplier is skipped for a cache hit.
Use tools/run_case.py case08 --observe once the tool exists.
Do not read expected/ or modify the code. Return observed evidence, not predicted output.
```

Claude maps actual lines to source and explains the mechanism. This can explain
what incorrect code did; it does not by itself establish the intended behaviour.

## 5. Compare with expected behaviour in a separate prompt

```text
Use /check-optional-results case08 as a separate check after the trace explanation.
Read expected/case08.txt and compare it with freshly observed RESULT lines.
Use python3 tools/run_case.py case08 --check once the tool exists.
Show expected versus actual, pass/fail and the relevant Optional rule for every observation.
Additional explanatory stdout is allowed; require exit code 0 and empty stderr.
Do not repair code or change expectations here. Report defects and untested inputs.
```

Expected observation lines:

```text
RESULT cache-hit=Optional[cache Ada]; dbCalls=0
RESULT database-hit=Optional[db Ada]; dbCalls=1
RESULT missing=Optional.empty
```

or returns Optional<T>; orElseGet returns T. The source suppliers must return nonnull Optional objects. Missing cache data does not require a real database in this exercise.

## 6. Repair only when a check identifies a defect

```text
Repair only the reported defect in case08.
Explain its cause using the relevant Optional API contract and propose a focused change.
Preserve earlier packages and fixed expected results; keep observations derived from real calls.
After changing the source, stop and show the diff. Mark previous execution evidence stale.
We will send the run-and-trace prompt and expected-result prompt again as separate steps.
```

Repeat stages4 and5 after a repair. Keep actual output separate from predictions
and record the prompt revision in work/evidence.md. JUnit is added in its own
later lesson; it checks methods and boundaries beyond the displayed main inputs.
