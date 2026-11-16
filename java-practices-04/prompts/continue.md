# Continue the reviewed build

Replace `<STEP_ID>` with the chosen final checkpoint from your root plan.

```text
Continue the reviewed Java 04 plan as the orchestrator.
MODE=EXECUTE
STOP_AFTER=<STEP_ID>
Reconcile log.md, Git and evidence using workflow/recovery.md first.
Complete only eligible steps in dependency order through STOP_AFTER.
Keep sequential ownership, actual verification, retained evidence and one
local commit per accepted step. Report checks, hash and next action after
each checkpoint. Stop at the requested boundary. Do not push.
```
