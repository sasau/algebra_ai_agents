# Stop at the next checkpoint

```text
Finish only the active step: verify, record evidence and log, make its local
checkpoint commit and report the hash. Stop before another step. If any
check fails, record the failure and stop without a completion commit.
In planning mode, finish the current planning document and stop without
changing code or making a commit.
```

# Stop immediately

```text
Stop now. Cancel active workers and wait until they stop writing. Preserve
partial changes. If tools remain available, record phase/step, base, paths,
actual checks, open issue and next action in log.md; mark an active
implementation step interrupted. Do not mark complete or commit unfinished
work. Report how to resume with resume.md.
```
