# Stop at a checkpoint

```text
Finish only the currently active step, verify it, update log.md and evidence,
make its local checkpoint commit, report the hash, and stop before another step.
If verification fails, log the failure and stop without a completion commit.
```

# Stop immediately

```text
Stop building now. Cancel active workers and wait for them to stop writing.
Preserve all partial changes. If tools are available, mark the active step
interrupted in log.md and record last base commit, edited files, actual checks,
unresolved issues and exact next action. Do not mark it complete or make a
completion commit. Report how to resume using resume.md.
```

If the agent process is terminated before it can write the log, use `resume.md`
anyway: recovery checks the working tree rather than assuming a clean stop.
