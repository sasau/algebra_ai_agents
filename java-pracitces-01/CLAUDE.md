# Java Practice 01 — Optional, one prompt at a time

Teach Java Optional through informative main programs and staged student prompts.
The current prompt authorizes one stage. Stop when that stage is complete.

- **Create agent:** write the requested definition; do not implement Java yet.
- **Build:** explain a small plan, implement and package; do not launch a main.
- **Explain:** improve comments/JavaDoc and narration; do not run the JAR.
- **Observe:** rebuild/run the real JAR, read stdout/stderr/exit and connect output to code.
  Do not read expected/ or change source during this stage.
- **Check expected:** compare fresh observations with fixed RESULT lines. Do not repair.
- **Repair:** change only the reported defect, then stop; previous evidence becomes stale.

Use Java 21 and the Maven Wrapper. Preserve existing packages, lesson resources and
student work. Each use case has its own package/main and an app.Main route.
System.out narration should explain inputs, operations and outcomes. Stable observed
result lines start `RESULT ` and derive from real method calls. Expected fixtures
list only those lines; other explanatory stdout is allowed. Never edit fixtures to pass.
Do not read/copy reference/ unless the student requests help after an attempt.

There are initially no active project agents, skills, Maven project or Python tool.
Students create them through the explicit lesson prompts. Reference/resources are
inactive examples. Skills are reusable instructions; the CLI performs deterministic
execution/comparison. Neither replaces explaining the relevant Java operation.

Add JUnit only in its lesson. Source review, main execution, expected-result checks
and unit tests establish different facts. Report only commands actually run, and
mark unavailable checks NOT RUN. Do not continue to future stages or delegate onward.
