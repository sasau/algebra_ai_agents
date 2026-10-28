# case05 — flatMap — combine Optional-returning lookups

**Guided follow-up**. This page is the complete sequence;
there is no separate brief to hand to Claude. Send one prompt, inspect the result,
then continue. All examples are independent packages in the same Maven project.

## Understand the Java operation

A lookup that already returns Optional creates nesting when passed to map. flatMap uses that Optional result directly, so one lookup chain still has one layer of absence. This is useful when a customer may be missing and an existing customer may also have no email.

Use users u1 and u2, but give only u1 email ada@example.org. Also try an unknown user.

```java
// Optional<Optional<String>>
findUser(id).map(Main::findEmail);
// Optional<String>
findUser(id).flatMap(Main::findEmail);
```

This is an explanatory excerpt. The full implementation uses public methods and a
main in `edu.algebra.optional.case05flatmapping`. 

## 1. Build an informative example

```text
Use java-tutor to build case05 in edu.algebra.optional.case05flatmapping; follow our build stage.
Implement findUser, findEmail, nestedEmailFor with map, and emailFor with flatMap.
Use users u1 and u2, but give only u1 email ada@example.org. Also try an unknown user.
Make main informative: System.out shows inputs, operations and outcomes from real method calls.
RESULT labels: map(u1), flatMap(u1), flatMap(u2), flatMap(missing).
Print the standard Optional text, including the nested map(u1) result.
Wire the case into app.Main and --list; preserve fixed observations.
Preserve prior cases. Package only; do not launch the JAR or read expected/reference code.
```

Inspect the small plan, methods and console statements. Compilation is the result
of this stage; the main has not been run. The RESULT prefix identifies stable
observations for later checks; ordinary explanatory text remains free to improve.

## 2. Update the code with explanations

```text
Use java-tutor to annotate case05; follow our explanation stage.
Show Optional<Optional<String>> versus Optional<String>; explain missing user versus missing email.
Add concise JavaDoc/comments and improve explanatory stdout without changing RESULT lines.
Explain the types, the empty path and one pitfall. Show the excerpt; do not run it yet.
```

Read the comments. Verify that they explain types, empty paths and evaluation,
not only repeat the method names. A comment is an explanation, not execution evidence.

## 3. Predict and run it yourself

Predict the number of Optional layers and whether email lookup runs for a missing user.

```bash
./mvnw -q clean package -DskipTests
java -jar target/optional-lab.jar case05
```

Read the terminal output before asking Claude to explain it. After the tool step,
you may also run `python3 tools/run_case.py case05 --observe` directly. The wrapper
must rebuild after source/narration changes so the JAR reflects current code.

## 4. Ask Claude to run and trace the output

```text
Use /run-optional-case case05 for the observation stage.
Rebuild and run the actual JAR; read stdout, stderr and exit code.
Map important output lines to the producing code and explain the Optional behaviour.
Focus: Show Optional<Optional<String>> versus Optional<String>; explain missing user versus missing email.
Use tools/run_case.py case05 --observe once the tool exists.
Do not read expected/ or modify the code. Return observed evidence, not predicted output.
```

Claude maps actual lines to source and explains the mechanism. This can explain
what incorrect code did; it does not by itself establish the intended behaviour.

## 5. Compare with expected behaviour in a separate prompt

```text
Use /check-optional-results case05 as a separate check after the trace explanation.
Read expected/case05.txt and compare it with freshly observed RESULT lines.
Use python3 tools/run_case.py case05 --check once the tool exists.
Show expected versus actual, pass/fail and the relevant Optional rule for every observation.
Additional explanatory stdout is allowed; require exit code 0 and empty stderr.
Do not repair code or change expectations here. Report defects and untested inputs.
```

Expected observation lines:

```text
RESULT map(u1)=Optional[Optional[ada@example.org]]
RESULT flatMap(u1)=Optional[ada@example.org]
RESULT flatMap(u2)=Optional.empty
RESULT flatMap(missing)=Optional.empty
```

flatMap requires a nonnull Optional from its mapper. map can turn a null mapper result into empty; do not conflate these contracts.

## 6. Repair only when a check identifies a defect

```text
Repair only the reported defect in case05.
Explain its cause using the relevant Optional API contract and propose a focused change.
Preserve earlier packages and fixed expected results; keep observations derived from real calls.
After changing the source, stop and show the diff. Mark previous execution evidence stale.
We will send the run-and-trace prompt and expected-result prompt again as separate steps.
```

Repeat stages4 and5 after a repair. Keep actual output separate from predictions
and record the prompt revision in work/evidence.md. JUnit is added in its own
later lesson; it checks methods and boundaries beyond the displayed main inputs.
