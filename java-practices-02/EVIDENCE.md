# Student execution evidence

Record fresh evidence after each build or repair. Do not copy instructor results.

## Environment

- Date, machine and OS:
- Exact `java -version` and `mvn -version`:
- Source revision or description of the checked diff:
- Manual run or agent run:

## Per-step observation

Supplied plan and selected implementation step:
Focused JUnit class and changed source:
Optional explanation HTML path:

| Lesson/step | Exact command | Exit | Actual stdout/stderr | Tests run/fail/skip | Review verdict |
|---|---|---:|---|---|---|
| | | | | | |

State the predicted invariant, the evidence supporting it, remaining limits and
any repair that made earlier observations stale. A skipped check is NOT RUN.
Retain expected/observed assertion values and the real JUnit totals. Explain
what the Claude-drawn diagram illustrates and which values came from execution.

## Thread comparison

Retain the complete sample rows from the JVM, not only the table of medians.

- Task count, blocking wait, CPU iterations, pool size, resource limit:
- Warmup rounds, measured rounds, mode order, timing boundary:
- Completion and checksum equality checked for each workload:

| Workload | Mode | Median elapsed ms | Completed | Checksum | Actual virtual tasks |
|---|---|---:|---:|---:|---:|
| Blocking | Sequential | | | | |
| Blocking | Platform pool | | | | |
| Blocking | Platform per task | | | | |
| Blocking | Virtual per task | | | | |
| CPU | Sequential | | | | |
| CPU | Platform pool | | | | |
| CPU | Platform per task | | | | |
| CPU | Virtual per task | | | | |

Explain the observed differences and limits. State that simulated waiting is not
a measured external service and that no memory result was collected.

## Dining philosophers

- Forced first-fork ownership count and worker cleanup:
- Ordered meal counts in both thread strategies:
- Fork-exclusivity instrumentation result:
- Why P4 acquires F0 before F4:
- Why a successful bounded run does not prove starvation freedom:
