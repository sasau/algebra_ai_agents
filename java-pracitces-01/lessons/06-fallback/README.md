# case06 — Fallback — distinguish eager and lazy evaluation

**Live class**. This page is the complete sequence;
there is no separate brief to hand to Claude. Send one prompt, inspect the result,
then continue. All examples are independent packages in the same Maven project.

## Understand the Java operation

orElse receives an already evaluated argument, even when the Optional is present. orElseGet receives a Supplier and invokes it only for absence. A counter makes the difference visible without timing. The returned name can be identical while the amount of fallback work differs.

Use present Ada and an empty Optional. Use a fresh fallback counter for each observation.

```java
// argument is evaluated first
name.orElse(fallback.get());
// supplier runs only for empty
name.orElseGet(fallback);
```

This is an explanatory excerpt. The full implementation uses public methods and a
main in `edu.algebra.optional.case06fallback`. 

## 1. Build an informative example

```text
Use java-tutor to build case06 in edu.algebra.optional.case06fallback; follow our build stage.
Implement eagerName with orElse(fallback.get()) and lazyName with orElseGet(fallback).
Use present Ada and an empty Optional. Use a fresh fallback counter for each observation.
Make main informative: System.out shows inputs, operations and outcomes from real method calls.
RESULT labels: present.orElse, present.orElseGet, empty.orElseGet.
The fallback returns guest. Append ; fallbackCalls=<count> to each observation.
Wire the case into app.Main and --list; preserve fixed observations.
Preserve prior cases. Package only; do not launch the JAR or read expected/reference code.
```

Inspect the small plan, methods and console statements. Compilation is the result
of this stage; the main has not been run. The RESULT prefix identifies stable
observations for later checks; ordinary explanatory text remains free to improve.

## 2. Update the code with explanations

```text
Use java-tutor to annotate case06; follow our explanation stage.
Explain argument evaluation before orElse and supplier execution only for empty orElseGet.
Add concise JavaDoc/comments and improve explanatory stdout without changing RESULT lines.
Explain the types, the empty path and one pitfall. Show the excerpt; do not run it yet.
```

Read the comments. Verify that they explain types, empty paths and evaluation,
not only repeat the method names. A comment is an explanation, not execution evidence.

## 3. Predict and run it yourself

Predict both returned names AND supplier counts. Equal returned names do not imply equal work.

```bash
./mvnw -q clean package -DskipTests
java -jar target/optional-lab.jar case06
```

Read the terminal output before asking Claude to explain it. After the tool step,
you may also run `python3 tools/run_case.py case06 --observe` directly. The wrapper
must rebuild after source/narration changes so the JAR reflects current code.

## 4. Ask Claude to run and trace the output

```text
Use /run-optional-case case06 for the observation stage.
Rebuild and run the actual JAR; read stdout, stderr and exit code.
Map important output lines to the producing code and explain the Optional behaviour.
Focus: Explain argument evaluation before orElse and supplier execution only for empty orElseGet.
Use tools/run_case.py case06 --observe once the tool exists.
Do not read expected/ or modify the code. Return observed evidence, not predicted output.
```

Claude maps actual lines to source and explains the mechanism. This can explain
what incorrect code did; it does not by itself establish the intended behaviour.

## 5. Compare with expected behaviour in a separate prompt

```text
Use /check-optional-results case06 as a separate check after the trace explanation.
Read expected/case06.txt and compare it with freshly observed RESULT lines.
Use python3 tools/run_case.py case06 --check once the tool exists.
Show expected versus actual, pass/fail and the relevant Optional rule for every observation.
Additional explanatory stdout is allowed; require exit code 0 and empty stderr.
Do not repair code or change expectations here. Report defects and untested inputs.
```

Expected observation lines:

```text
RESULT present.orElse=Ada; fallbackCalls=1
RESULT present.orElseGet=Ada; fallbackCalls=0
RESULT empty.orElseGet=guest; fallbackCalls=1
```

Use a literal or cheap already available value with orElse. Use orElseGet for deferred work. The invocation counter is stronger evidence than a short timing comparison.

## 6. Repair only when a check identifies a defect

```text
Repair only the reported defect in case06.
Explain its cause using the relevant Optional API contract and propose a focused change.
Preserve earlier packages and fixed expected results; keep observations derived from real calls.
After changing the source, stop and show the diff. Mark previous execution evidence stale.
We will send the run-and-trace prompt and expected-result prompt again as separate steps.
```

Repeat stages4 and5 after a repair. Keep actual output separate from predictions
and record the prompt revision in work/evidence.md. JUnit is added in its own
later lesson; it checks methods and boundaries beyond the displayed main inputs.
