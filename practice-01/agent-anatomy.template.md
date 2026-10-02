# Practice 01 — agent-anatomy

**Name:**
**Date:**
**Track I ran in Act 2:** TypeScript / Java  *(delete one)*
**Model the hand-written loop used:** `claude-haiku-4-5`

> Copy this file to `agent-anatomy.md` and fill it in as you go.
> `cp agent-anatomy.template.md agent-anatomy.md`
>
> This file is the "when to use an agent" gate at the top of your lusql
> harness. In Session 15 it becomes the opening of your `PLAN.md`.

---

# Part 1 — the five words, from your own runs (Act 1)

You fixed the same failing test in `parser-java/` several ways. Fill one row
per way with what **you observed**, not what the lecture said. Reset the bug
between rows with `git checkout -- src/main`.

| way | who picked the next step? | remembered across steps? | acted on the world? | did the test go green? | one line of evidence (paste) |
|---|---|---|---|---|---|
| **tool** — `./gradlew test --tests ParserTest` | | | | | |
| **skill** — `/fix-test` | | | | | |
| **workflow** — `./workflow.sh` | | | | | |
| **chat** — pasted the failure into `claude`, applied the fix by hand | | | | | |
| **agent** — same session: "Make the test pass…", approved each action | | | | | |
| **agentic mode** — the moment that session went from answering to acting | | | | | |

**The one column that separates the five words** (lecture slide 10). In your
own words, what is it, and which rows share a value?

**The skill's `description` decided whether it was loaded.** Paste the
description of `fix-test`, then say which words in it matched your request:

```
```

**The workflow never edited anything.** Which line of `workflow.sh` proves
that the path was fixed by a human in advance?

---

# Part 2 — the labelled trace (from your Act 1 transcript, or Act 2's printed run)

Paste 8–15 representative lines. Label every line **P** (perceive), **D**
(decide), **A** (act) or **O** (observe), using the lecture's rule (slide 21):
*Act is every tool call, including Read; Perceive is what the model had in
front of it when the turn began.*

```
[P]
[D]
[A]
[O]
```

**Now name the five parts of this agent with their concrete instance**
(lecture slide 18):

| part | the instance in this run |
|---|---|
| goal | |
| model | |
| tools | |
| memory | |
| stopping condition — success half | |
| stopping condition — budget half | |

**Act 2 only — when you ran `--max-steps 3`:** what did the loop print, and
which half of the stopping condition fired?

```
```

**The hardest line to label, and why:**

---

# Part 3 — the autonomous run (Act 3)

**The limits I set** (from `docker/run.sh`): `--max-turns` = `--max-budget-usd` =

**What `result.json` claimed** — paste the summary lines `run.sh` printed
(`subtype`, `num_turns`, `total_cost_usd`, `is_error` if present, and the
`result` text):

```
```

**What `verify.sh` proved from outside the box** — tests, `git diff --stat`,
tests untouched?, no tests skipped?:

```
```

**Did the claim and the evidence agree?** If not, what was the difference?

**`break-it.sh`** — with a goal that can never check true, what stopped the
bot, and how do you know? (`subtype` and `num_turns`):

```
```

**The ONE rule of the five** (lecture slides 30–34) you saw matter most today,
and the moment you saw it:

**Why was `--dangerously-skip-permissions` acceptable here and not on your
laptop?** Name the three things that made it safe.

---

# Part 4 — the lusql verdict

One paragraph. Is **lusql** — the from-scratch SQL engine your harness will
build in the capstone (Session 15), after fourteen weeks of building that
harness — agent-shaped? Argue from the lecture's three questions
(**fixed path? · must adapt? · recoverable?**, slides 28–29) and the three
signatures (**open-ended · needs feedback · many similar sub-tasks**, slide
20). Say which rung of the ladder (Figure 1.3, slide 24) you would run it on,
and where you would put a human gate.

---

## One thing that surprised me
