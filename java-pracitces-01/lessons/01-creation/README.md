# case01 — Creation — of, ofNullable and empty

**Live class**. This page is the complete sequence;
there is no separate brief to hand to Claude. Send one prompt, inspect the result,
then continue. All examples are independent packages in the same Maven project.

## Understand the Java operation

An Optional<T> contains one nonnull T or no value. of requires a nonnull argument; ofNullable converts a nullable boundary value into present/empty. empty creates explicit absence. The Optional variable itself should not be null.

Use Ada, a null name and explicit absence. Show of(null) as a caught, expected failure.

```java
Optional.of("Ada");
Optional.ofNullable(null);
Optional.<String>empty();
```

This is an explanatory excerpt. The full implementation uses public methods and a
main in `edu.algebra.optional.case01creation`. 

## What we will build

Build a small console program about names that may be present or missing.
`case01` is the exercise name and the argument that selects it in the launcher.
The example inputs are written directly in Java, so there is no case-data input file.

Write these three methods, each returning `Optional<String>`:

| Method to write | In plain language | Example result |
|---|---|---|
| `requiredName(String name)` | A name must be supplied. | `"Ada"` gives a present Optional; null throws. |
| `nullableName(String name)` | The incoming name may be missing. | null gives an empty Optional. |
| `emptyName()` | Return no name deliberately. | An empty Optional, rather than a null container. |

Write a `main` that calls these methods, explains each input/operation/outcome,
and prints results calculated from the calls. Catch the deliberate
`requiredName(null)` failure so the demonstration can finish successfully.

Files and responsibilities:

- Create `src/main/java/edu/algebra/optional/case01creation/Main.java` with the methods and demo main.
- Update `src/main/java/edu/algebra/optional/app/Main.java` to route `case01` to this demo and list it in `--list`.
- This README contains the full prompts, one stage at a time.
- The supplied `expected/case01.txt` is used for later comparison, not as program input. Its complete contents appear in stage5 below.

The sequence is understand → build → explain → run → compare. Package first;
do not claim a successful run or expected-result check until those later stages.

## 1. Build an informative example

```text
Use java-tutor for the build stage of case01; stop after this stage.
Create edu.algebra.optional.case01creation.Main and wire case01 into app.Main and --list.
Implement requiredName(String), nullableName(String) and emptyName() with of, ofNullable and empty.
Use Ada, a null name and explicit absence. Show of(null) as a caught, expected failure.
Use System.out.println to show inputs, the Optional operation and what each result means.
Print observations from real method calls; prefix stable result lines with RESULT .
Use these result labels: of, ofNullable(null), empty.isEmpty, of(null).
Print the contained value for of, Optional text for ofNullable, isEmpty for empty and the caught type.
Give a small plan, implement and package with ./mvnw -q clean package -DskipTests.
Preserve earlier cases. Do not read expected/ or reference/; do not run the JAR yet.
Report changed files and compile status, with main execution marked NOT RUN.
```

Inspect the small plan, methods and console statements. Compilation is the result
of this stage; the main has not been run. The RESULT prefix identifies stable
observations for later checks; ordinary explanatory text remains free to improve.

## 2. Update the code with explanations

```text
Update case01 for learning; keep its behaviour and RESULT lines unchanged.
Add concise JavaDoc to public methods and comments beside the important Optional operations.
Explain why of rejects null, why ofNullable(null) is empty, and why the Optional object itself is nonnull.
Explain why the chosen operation fits this example and one relevant pitfall.
Improve ordinary System.out narration so a student can connect input, operation and outcome.
Derive observations from method calls; do not replace calculations with hardcoded answers.
Show the annotated excerpt and explain the changes. Stop without running the JAR.
```

Read the comments. Verify that they explain types, empty paths and evaluation,
not only repeat the method names. A comment is an explanation, not execution evidence.

## 3. Predict and run it yourself

Predict which null input becomes empty and which throws. Identify whether the empty Optional is itself null.

```bash
./mvnw -q clean package -DskipTests
java -jar target/optional-lab.jar case01
```

Read the terminal output before asking Claude to explain it. After the tool step,
you may also run `python3 tools/run_case.py case01 --observe` directly. The wrapper
must rebuild after source/narration changes so the JAR reflects current code.

## 4. Ask Claude to run and trace the output

```text
Run case01 now and connect the actual output to its code.
Rebuild: ./mvnw -q clean package -DskipTests
Execute: java -jar target/optional-lab.jar case01
Capture actual stdout, stderr and exit code. Stop and report a failed build or process.
For each important line, name the producing method/line and explain the input and Optional state.
Explain why of rejects null, why ofNullable(null) is empty, and why the Optional object itself is nonnull.
Do not read expected/ yet. Do not edit code; report any mismatch between code and observation.
A code-to-output explanation is not yet a check against the expected Java behaviour.
```

Claude maps actual lines to source and explains the mechanism. This can explain
what incorrect code did; it does not by itself establish the intended behaviour.

## 5. Compare with expected behaviour in a separate prompt

The entire supplied `expected/case01.txt` is:

```text
RESULT of=Ada
RESULT ofNullable(null)=Optional.empty
RESULT empty.isEmpty=true
RESULT of(null)=NullPointerException
```

Compare these four stable lines with a fresh run. Additional explanatory stdout
is allowed. Require exit0 and empty stderr. Do not have the Java program read
this file or hardcode its lines as results; actual values come from method calls.
Keep the fixture fixed. JUnit tests are introduced later.

```text
Check case01 against the expected results in expected/case01.txt.
Use fresh execution evidence; rebuild and rerun if the source changed.
Compare every RESULT line in order; additional explanatory stdout is allowed.
Show a table: expected result, actual result, pass/fail and the Java rule involved.
Require exit code 0 and empty stderr. Report missing, extra or different RESULT lines.
Do not edit source or expected files in this check. Report defects for a separate repair prompt.
Explain what this check establishes and which inputs remain untested.
```

Optional.empty() is an object representing absence. A null Optional variable would introduce a separate, unintended missing-container state.

## 6. Repair only when a check identifies a defect

```text
Repair only the reported defect in case01.
Explain its cause using the relevant Optional API contract and propose a focused change.
Preserve earlier packages and fixed expected results; keep observations derived from real calls.
After changing the source, stop and show the diff. Mark previous execution evidence stale.
We will send the run-and-trace prompt and expected-result prompt again as separate steps.
```

Repeat stages4 and5 after a repair. Keep actual output separate from predictions
and record the prompt revision in work/evidence.md. JUnit is added in its own
later lesson; it checks methods and boundaries beyond the displayed main inputs.
