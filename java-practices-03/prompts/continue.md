# Continue to a chosen checkpoint

```text
Continue as the Java 03 orchestrator. STOP_AFTER=02
Reconcile log.md, Git and evidence through workflow/recovery.md first.
Complete the next eligible steps through that stop point, with focused tests,
full regression checks, durable log updates and one local commit per verified
step. Report each commit and stop at the requested checkpoint. Do not push.
```

Change 02 to the desired last step. Use `STOP_AFTER=10` for the whole remaining
build; a failing check or a stop request still interrupts advancement.
