# Planning kickoff — paste into the main coding-agent conversation

```text
Act as .claude/agents/orchestrator.md for Java 04.
MODE=PLAN
STOP_AFTER=PLAN

Help me design my own orchestrated build plan. Do not implement it yet.
Read AGENTS.md, assignment.md, log.md, workflow/, and plans/README.md.
Inspect the existing pom.xml, production source and tests at the root.
Run the baseline suite and record actual commands, exits and test counts.

Use plans/next-practice.md for scope and plans/java03-reference/plan.md,
its contracts, steps and workflow as examples. The old plan starts empty;
this project already contains that completed server. Its steps are reference
only. Choose and justify our own Java 04 increments and dependency order.

Create root plan.md, detailed steps/, contracts/transport.md and
contracts/design.md. Update log.md with pending checkpoints and a clear
next action. Define ownership, task envelopes, interfaces, bounded context,
model choices, repair limits, acceptance tests, evidence, local commits,
STOP_AFTER and recovery. Each task must be small enough to inspect and verify.
Follow assignment.md for the transport decisions and compatibility gates.

Preserve the existing application, tests and runnable JDK-backed comparison
path. Final core compatibility includes bounded chunked bodies. Distinguish
connection limits from handler admission. Plan raw-socket failure tests and
actual verification rather than treating worker claims as evidence.

Change planning documents and new evidence only. Do not edit source, tests
or pom.xml; do not initialize Git or make commits in this planning phase.
Do not dispatch implementation workers. Use the main session to prepare
the plan, then explain its dependencies and unresolved decisions.
Stop when the plan is ready for my review. Implementation needs a later
explicit instruction and a stop point from the reviewed plan.
```

The planning task is the student deliverable. Review and revise the output
until you can explain why each step is safe to accept before the next one.
