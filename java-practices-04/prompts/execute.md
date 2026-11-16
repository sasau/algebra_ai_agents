# Execute after reviewing your plan

Use this only in your independent student copy outside the shared practices
Git repository. Replace `<FIRST_STEP_ID>` with a real step from your plan.

```text
Act as .claude/agents/orchestrator.md for Java 04.
I have reviewed the root plan.md, steps/ and contracts/ and authorize execution.
MODE=EXECUTE
STOP_AFTER=<FIRST_STEP_ID>

Reconcile log.md, Git root/status/history and evidence first. Confirm this
is an independent student workspace; never commit into a parent repository.
Follow workflow/checkpoints.md for the verified baseline import if it does
not already exist. Maven, production source and tests are already present.
Do not repeat Java 03's bootstrap or execute its archived plan.

Build only eligible steps of our reviewed plan, in dependency order through
STOP_AFTER. Dispatch java-builder, test-builder and verifier sequentially;
save actual task IDs and wait for real completion. Record fallback honestly
if native delegation is unavailable. Capture real focused tests, mvn -B
verify, manual checks, test totals and source hashes. Retain failed attempts.
Only the orchestrator accepts, updates log.md and makes checkpoint commits.
A failed gate prevents advancement. Honor normal approvals and direct stops.
Report each accepted hash and stop at the requested boundary. Do not push.
```
