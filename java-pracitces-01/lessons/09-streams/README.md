# case09 — stream — collect only the present values

**Guided follow-up**. This page is the complete sequence;
there is no separate brief to hand to Claude. Send one prompt, inspect the result,
then continue. All examples are independent packages in the same Maven project.

## Understand the Java operation

Optional.stream converts a present Optional into a one-element Stream and an empty Optional into an empty Stream. Stream.flatMap can then flatten a collection of optional results. This is a different flatMap API from Optional.flatMap: the receiver and the function result types determine which operation is being used.

Use [Optional.of(" Ada "), Optional.empty(), Optional.of("Lin"), Optional.of("   ")].

```java
return names.stream()
    .flatMap(Optional::stream)
    .map(String::trim)
    .filter(name -> !name.isBlank())
    .toList();
```

This is an explanatory excerpt. The full implementation uses public methods and a
main in `edu.algebra.optional.case09streams`. 

## 1. Build an informative example

```text
Use java-tutor to build case09 in edu.algebra.optional.case09streams; follow our build stage.
Implement presentNames with Stream.flatMap(Optional::stream), trim, remove blanks and collect toList().
Use [Optional.of(" Ada "), Optional.empty(), Optional.of("Lin"), Optional.of("   ")].
Make main informative: System.out shows inputs, operations and outcomes from real method calls.
RESULT labels: names, count.
Print the List text under names, then its size under count.
Wire the case into app.Main and --list; preserve fixed observations.
Preserve prior cases. Package only; do not launch the JAR or read expected/reference code.
```

Inspect the small plan, methods and console statements. Compilation is the result
of this stage; the main has not been run. The RESULT prefix identifies stable
observations for later checks; ordinary explanatory text remains free to improve.

## 2. Update the code with explanations

```text
Use java-tutor to annotate case09; follow our explanation stage.
Explain zero-or-one elements from Optional.stream and the outer Stream.flatMap operation.
Add concise JavaDoc/comments and improve explanatory stdout without changing RESULT lines.
Explain the types, the empty path and one pitfall. Show the excerpt; do not run it yet.
```

Read the comments. Verify that they explain types, empty paths and evaluation,
not only repeat the method names. A comment is an explanation, not execution evidence.

## 3. Predict and run it yourself

Predict which names survive, their order and how many elements each Optional contributes.

```bash
./mvnw -q clean package -DskipTests
java -jar target/optional-lab.jar case09
```

Read the terminal output before asking Claude to explain it. After the tool step,
you may also run `python3 tools/run_case.py case09 --observe` directly. The wrapper
must rebuild after source/narration changes so the JAR reflects current code.

## 4. Ask Claude to run and trace the output

```text
Use /run-optional-case case09 for the observation stage.
Rebuild and run the actual JAR; read stdout, stderr and exit code.
Map important output lines to the producing code and explain the Optional behaviour.
Focus: Explain zero-or-one elements from Optional.stream and the outer Stream.flatMap operation.
Use tools/run_case.py case09 --observe once the tool exists.
Do not read expected/ or modify the code. Return observed evidence, not predicted output.
```

Claude maps actual lines to source and explains the mechanism. This can explain
what incorrect code did; it does not by itself establish the intended behaviour.

## 5. Compare with expected behaviour in a separate prompt

```text
Use /check-optional-results case09 as a separate check after the trace explanation.
Read expected/case09.txt and compare it with freshly observed RESULT lines.
Use python3 tools/run_case.py case09 --check once the tool exists.
Show expected versus actual, pass/fail and the relevant Optional rule for every observation.
Additional explanatory stdout is allowed; require exit code 0 and empty stderr.
Do not repair code or change expectations here. Report defects and untested inputs.
```

Expected observation lines:

```text
RESULT names=[Ada, Lin]
RESULT count=2
```

The outer flatMap is a Stream operation. Optional.stream supplies either zero or one element; Stream.flatMap joins those streams.

## 6. Repair only when a check identifies a defect

```text
Repair only the reported defect in case09.
Explain its cause using the relevant Optional API contract and propose a focused change.
Preserve earlier packages and fixed expected results; keep observations derived from real calls.
After changing the source, stop and show the diff. Mark previous execution evidence stale.
We will send the run-and-trace prompt and expected-result prompt again as separate steps.
```

Repeat stages4 and5 after a repair. Keep actual output separate from predictions
and record the prompt revision in work/evidence.md. JUnit is added in its own
later lesson; it checks methods and boundaries beyond the displayed main inputs.
