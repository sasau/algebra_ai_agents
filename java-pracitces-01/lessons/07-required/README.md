# case07 — Required value — translate absence into an exception

**Guided follow-up**. This page is the complete sequence;
there is no separate brief to hand to Claude. Send one prompt, inspect the result,
then continue. All examples are independent packages in the same Maven project.

## Understand the Java operation

orElseThrow turns absence into an explicit failure at a boundary where a value is required. A custom exception can name the missing business entity. Calling get on an empty Optional throws NoSuchElementException without that domain context. Exceptions in this demonstration are caught deliberately so the expected failure can be observed in stdout.

Use u1=Ada and missing u9. Also demonstrate get on an empty Optional as a labelled pitfall.

```java
return lookup.orElseThrow(() ->
    new MissingCustomerException(
        "No customer: " + id));
```

This is an explanatory excerpt. The full implementation uses public methods and a
main in `edu.algebra.optional.case07required`. 

## 1. Build an informative example

```text
Use java-tutor to build case07 in edu.algebra.optional.case07required; follow our build stage.
Implement requireName with orElseThrow and MissingCustomerException; add unsafeEmptyGet for the pitfall.
Use u1=Ada and missing u9. Also demonstrate get on an empty Optional as a labelled pitfall.
Make main informative: System.out shows inputs, operations and outcomes from real method calls.
RESULT labels: u1, u9, empty.get.
Use message No customer: <id>. Print class: message for u9 and only the type for empty.get.
Wire the case into app.Main and --list; preserve fixed observations.
Preserve prior cases. Package only; do not launch the JAR or read expected/reference code.
```

Inspect the small plan, methods and console statements. Compilation is the result
of this stage; the main has not been run. The RESULT prefix identifies stable
observations for later checks; ordinary explanatory text remains free to improve.

## 2. Update the code with explanations

```text
Use java-tutor to annotate case07; follow our explanation stage.
Explain the required-value boundary, custom exception supplier and deliberately caught demonstration
failures.
Add concise JavaDoc/comments and improve explanatory stdout without changing RESULT lines.
Explain the types, the empty path and one pitfall. Show the excerpt; do not run it yet.
```

Read the comments. Verify that they explain types, empty paths and evaluation,
not only repeat the method names. A comment is an explanation, not execution evidence.

## 3. Predict and run it yourself

Predict exception types and messages. Distinguish the intended caught failure from process failure.

```bash
./mvnw -q clean package -DskipTests
java -jar target/optional-lab.jar case07
```

Read the terminal output before asking Claude to explain it. After the tool step,
you may also run `python3 tools/run_case.py case07 --observe` directly. The wrapper
must rebuild after source/narration changes so the JAR reflects current code.

## 4. Ask Claude to run and trace the output

```text
Use /run-optional-case case07 for the observation stage.
Rebuild and run the actual JAR; read stdout, stderr and exit code.
Map important output lines to the producing code and explain the Optional behaviour.
Focus: Explain the required-value boundary, custom exception supplier and deliberately caught
demonstration failures.
Use tools/run_case.py case07 --observe once the tool exists.
Do not read expected/ or modify the code. Return observed evidence, not predicted output.
```

Claude maps actual lines to source and explains the mechanism. This can explain
what incorrect code did; it does not by itself establish the intended behaviour.

## 5. Compare with expected behaviour in a separate prompt

```text
Use /check-optional-results case07 as a separate check after the trace explanation.
Read expected/case07.txt and compare it with freshly observed RESULT lines.
Use python3 tools/run_case.py case07 --check once the tool exists.
Show expected versus actual, pass/fail and the relevant Optional rule for every observation.
Additional explanatory stdout is allowed; require exit code 0 and empty stderr.
Do not repair code or change expectations here. Report defects and untested inputs.
```

Expected observation lines:

```text
RESULT u1=Ada
RESULT u9=MissingCustomerException: No customer: u9
RESULT empty.get=NoSuchElementException
```

Catch only the expected exception in the demonstration. A successful demonstration process can contain a deliberately caught failure; unexpected failures must remain visible.

## 6. Repair only when a check identifies a defect

```text
Repair only the reported defect in case07.
Explain its cause using the relevant Optional API contract and propose a focused change.
Preserve earlier packages and fixed expected results; keep observations derived from real calls.
After changing the source, stop and show the diff. Mark previous execution evidence stale.
We will send the run-and-trace prompt and expected-result prompt again as separate steps.
```

Repeat stages4 and5 after a repair. Keep actual output separate from predictions
and record the prompt revision in work/evidence.md. JUnit is added in its own
later lesson; it checks methods and boundaries beyond the displayed main inputs.
