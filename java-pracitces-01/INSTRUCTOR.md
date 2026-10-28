# Instructor — teach Optional through a progressive conversation

The first example is slow by design. Students learn two things together: Java
Optional semantics and how to direct a specialist through focused development
steps. Later cases reuse the built agent, skills and CLI; do not repeat every
mechanical command or let automation remove Java explanations.

## Pacing

One 120-minute class: agent/setup20, creation25, reusable tooling25, mapping15,
fallback15, JUnit20. Live cases are01,03,06. Seven other cases are guided follow-up.
The deck contains all stages and follow-up pages; it is not intended as a slide-per-minute lecture.
If repairs take time, prioritize the students’ actual observations and carry
unfinished test/tool stages into follow-up rather than claiming completion.

## Teaching protocol

- Build is a small plan, implementation and package only.
- Explain is a separate update adding useful JavaDoc/comments and stdout narration.
- Student manual execution comes first in case01.
- Claude observation uses real `java -jar` and maps actual output to source.
  It does not open expected files.
- Expected comparison is a separate prompt and reports defects without editing.
- Repair changes a reported defect, then stops. Evidence for the previous source
  is stale, so repeat observation and comparison.

Do not require a separate BRIEF hand-off. Each lesson README contains its complete
prompts, explanation, prediction, manual commands and expected observations.
The RESULT prefix is a lightweight lab convention so narration can improve while
stable observations remain comparable. It is not a Java or Claude feature.

## Agent and tooling milestones

Students first create java-tutor from the supplied seven-section template.
Active root agents are intentionally absent. Inactive examples and the completed
reference are for help after an attempt. Build one specialist before introducing
an optional reviewer. This is not a multi-agent orchestration lesson.

Separate the observation skill from the expected-check skill. The CLI executes
real Maven/JVM processes; Claude interprets Java source and stdout. Explicit modes
prevent an observation report from implying expected correctness.

## Reference verification

Run from a disposable reference copy, not the starter root:

```bash
./mvnw clean verify
python3 tools/run_case.py --all --observe
python3 tools/run_case.py --all --check --tests
```

Full reference: 10 cases,30 tests. Live subset: 01/03/06,9 tests. The tool discovers
implemented root case packages, not nested reference code.

A useful demonstration is to change only a RESULT label in a disposable copy:
unit tests and observation still pass, while expected comparison fails. Explain
why source tracing, process success, expected observations and unit assertions
support different claims. Never alter the fixed fixture to accept the mutation.

The practice has verified reference artifacts and commands. We have not tested
how long a whole student cohort takes or guaranteed identical Claude-generated
implementations; inspect actual student code, output and reports.
