---
name: run-optional-case
description: Observe one real Optional main and explain its actual output from the source.
---

Use the requested case ID. Follow CLAUDE.md's observation stage. Run the tool with
--observe when it exists, otherwise rebuild with the wrapper and launch java -jar.
Capture command/stdout/stderr/exit. Read current source and explain which method or
expression produced each important line, including types, absence and supplier work.
Do not read expected/, repair code or claim behavioural correctness. Stop and report
build/process failures; never run a stale JAR. Return observed evidence and a code trace.
