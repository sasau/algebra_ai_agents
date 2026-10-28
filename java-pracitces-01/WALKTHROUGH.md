# Live class — establish the procedure, then reuse it

Send one prompt at a time. Inspect its report before continuing. Do not paste an
entire lesson conversation as one task. Allow ordinary System.out narration so
students can inspect inputs, Optional operations and outcomes in the terminal.

## 0–20 minutes: first specialist and project

1. [Create java-tutor](prompts/00-create-java-tutor.md). Read the seven sections and tools.
2. [Build the Maven shell](prompts/01-bootstrap-build.md), then
   [explain its generated structure](prompts/02-bootstrap-explain.md).
3. Run hello manually once. Then ask Claude to [observe and trace startup](prompts/03-bootstrap-observe.md).
4. In another prompt, [check hello against its fixture](prompts/04-bootstrap-check.md).
5. [Create the bootstrap skill](prompts/05-bootstrap-skill.md), inspect it, then
   [apply it separately](prompts/06-use-bootstrap-skill.md).

## 20–45 minutes: creation, deliberately slow

Follow [case01](lessons/01-creation/README.md). Predict which null input becomes
empty and which throws. Use all six stages, keeping observation and expected
comparison separate. Students should run the JAR themselves before Claude’s
run-and-trace prompt. Repair only a reported defect, then reobserve and recheck.

## 45–70 minutes: extract reusable instructions and execution

1. [Create the observation skill](prompts/07-run-skill.md).
2. [Create the expected-check skill](prompts/08-check-skill.md).
3. [Create observation CLI mode](prompts/09-tool-observe.md).
4. [Add check mode and update skills](prompts/10-tool-check-update.md).
5. [Invoke observation](prompts/11-use-run-skill.md), then
   [invoke expected checking](prompts/12-use-check-skill.md) on case01.

The CLI executes and captures evidence. Claude still reads Java and explains it.
A skill stores instructions; it does not replace an execution tool.

## 70–85 minutes: mapping with existing tooling

Follow [case03](lessons/03-mapping/README.md). The build and annotation prompts
focus on String→Integer and skipped mappers. Reuse the run skill, then the check
skill. Explain why blank text yields present zero, while null yields absence.

## 85–100 minutes: eager and lazy fallback

Follow [case06](lessons/06-fallback/README.md). Predict **both** names and supplier
counts, using fresh counters. Reuse the same observation/check tools. Equal names
alone do not show whether fallback work ran.

## 100–120 minutes: add method tests

1. [Add JUnit and Surefire](prompts/13-junit-dependency.md).
2. [Write case tests](prompts/14-unit-tests-build.md), then
   [explain assertions](prompts/15-unit-tests-explain.md).
3. [Run the suite](prompts/16-unit-tests-run.md) and read actual reports.
4. [Extend the verifier and create its skill](prompts/17-final-tool-update.md).
5. [Run final verification](prompts/18-final-verification.md).

Live reference: cases 01/03/06,9 tests,3 main checks. Students may need different
repairs; never fabricate matching output or counts to meet the schedule.

## Guided follow-up

Complete cases 02,04,05,07,08,09,10 in their lesson README order. They reuse the
agent, skills and CLI already created. After each case, add and explain three
contract-based tests and rerun the implemented suite. Preserve fixture files.
The final tool discovers implemented cases, so future cases need not exist yet.

[Refine java-tutor](prompts/19-agent-update.md) from successful prompts.
The [reviewer role](prompts/20-reviewer-extension.md) is a later extension.
Keep the seven-section structure. Tool access and written ownership boundaries
do not create filesystem isolation.
