# Practice 03 submission

Name / pair:
Date:
Node version:
Working directory:

Budget used (target 120 minutes):

## Implementation

Submit the three completed files, preserving the exact marker regions:

- `starter/react-agent.ts` — `TODO_ACT_1`.
- `starter/reflexion.ts` — `TODO_ACT_2`.
- `starter/delegate.ts` — `TODO_ACT_3`.

Do not submit `node_modules`, credentials, completed fixture edits or a generated replacement for the supplied trusted tests.

## Evidence

Paste actual commands, exit codes and **immutable evidence paths printed by your run**, not only latest aliases.

| Check | Command from practice-03 | Observed result | Evidence |
|---|---|---|---|
| Reproduce bug | `npm run fixture:test` | Expected 1 pass, 1 fail | Saved terminal output |
| ReAct | `npm run act:1 -- --impl starter --client offline` | | |
| Reflexion success | `npm run act:2 -- --impl starter --client offline` | | |
| Reflexion exhaustion | `npm run act:2 -- --impl starter --client offline --unsolvable` | | |
| Delegation | `npm run act:3 -- --impl starter --client offline` | | |
| Infrastructure | `npm test` and `npm run typecheck` | | |
| Reference | `npm run verify:offline` | | |
| Current student | `npm run verify:student` | | |
| Completed disposable student | `npm run verify:completed-student` | | |
| Real local inference (separate) | `npm run verify:local` | PASS/FAIL/not run + reason | |
| Real cloud inference (optional) | `npm run verify:cloud -- --run-cloud` | PASS/FAIL/SKIP + reason | |

## Explain the observed control flow

1. Quote one assistant request and its matching tool result ID. What prevented a second model call before that result was appended? What happened when two tools were requested in one turn?
2. Quote the first failed evaluation, written lesson and changed second attempt. Which source/lessons survived, and which messages started fresh? Why does this fixture not prove reflection improves a real model?
3. Show the child's initial two messages and available tools. Which information crossed the boundary in the brief and return? Why does a role prompt alone not enforce permissions?
4. Show the parent verification after the child returned. How do you know the source passed independently of a model's completion claim?
5. Show the unsolvable task stopping at attempt 2, with no third attempt. Give total parent, child and reflection calls, and the shared call limit.
6. Name one enforced security boundary and one limitation of Node permission-based evaluation.

Report offline scripted fixtures, actual local inference and actual cloud inference separately. Failed or skipped real-model runs are valid observations; invented inference results are not.
