# Act 2 · context lab — the six steps

One file per step. Each is copy-pasteable into the Claude Code CLI, the same
way the prompt lab works — but **the clearing rule is the opposite**, and that
contrast is the point.

| file | what you do | what it shows |
|---|---|---|
| `00-floor.md` | `/context` on an untouched session | the window is never empty |
| `01-fill.md` | make it read the whole `src/` tree | which part grows fastest |
| `02-cost.md` | `/cost` after the reading | what that growth actually cost |
| `03-ask.md` | "what does this project do?" | the answer *before* any house rules |
| `04-steer.md` | write `CLAUDE.md`, `/clear`, re-ask | same question, different answer |
| `05-plan-mode.md` | `shift+tab`, then something destructive | it plans and stops |

## ⚠ The clearing rule is inverted here

In `prompts/` you cleared before every single prompt, because each one had to
be measured in isolation.

**Here you must NOT clear** — except once, at exactly one moment:

| steps | clear? | why |
|---|---|---|
| `00` → `01` → `02` → `03` | **no — never** | you are growing a window on purpose and watching it fill. Clearing resets the measurement to zero and destroys the lab. |
| inside `04` | **yes, once** | after writing `CLAUDE.md`, exactly where the file says. The re-ask must start from a clean window or you cannot tell whether the new answer came from the file or from the conversation. |
| `05` | either | plan mode is independent of the rest. |

If you cleared by accident during `00`–`03`, start again from `00`. It costs a
couple of minutes and a few thousand tokens; an unclean measurement costs you
the finding.

## How to run it

```bash
cd algebra_ai_agents/practice-00
claude
# then work through 00 → 05 in order, in ONE session
```

Read each file's notes before you paste — they say what to record, and several
of the numbers are only visible once (the floor in `00` can never be measured
again in the same session).

## What you are actually learning

Two things the prompt lab could not show you:

1. **A context window is finite, always partly full, and grows fastest from
   material you did not type.** One `read all the files` turn can outweigh an
   entire conversation. Sessions 08 and 11 exist because of this.
2. **You can change an agent's behaviour without changing your question.**
   `CLAUDE.md` is the standing-instructions layer — the same layer as `system`
   in a raw API call. Session 04 and Session 12 build on it.

Record everything in `findings.md`.
