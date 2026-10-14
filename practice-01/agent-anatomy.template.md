# Practice 01 — agent-anatomy

**Name:**
**Date:**
**Track I ran in Act 2:** TypeScript / Java  *(delete one)*
**Model the supplied loop used:** `claude-haiku-4-5`

> Copy this file to `agent-anatomy.md` and fill it in as you go.
> `cp agent-anatomy.template.md agent-anatomy.md`
>
> This file is the "when to use an agent" gate at the top of your lusql
> harness. In Session 15 it becomes the opening of your `PLAN.md`.

---

# Part 1 — six observations, from your own runs (Act 1)

You compared five ways of approaching the same test in fresh Java parser copies. Fill one row
per way with what **you observed**, not what the lecture said. Create a fresh Act 1 directory before each comparison with `node "$P01_ROOT/scripts/prepare-run.mjs" act1`; keep earlier copies.

| way | who picked the next step? | remembered across steps? | acted on the world? | did the test go green? | one line of evidence (paste) |
|---|---|---|---|---|---|
| **tool** — `./gradlew test --tests ParserTest` | | | | | |
| **skill** — `/fix-test` | | | | | |
| **workflow** — `./workflow.sh` | | | | | |
| **chat** — supplied failure/source to a no-tools request, applied the fix by hand | | | | | |
| **agent** — fresh session: "Make the test pass…", reviewed restricted actions | | | | | |
| **agentic interaction** — first tool request in the agent run | | | | | |

**Distinguish the roles.** Which row is a callable function, which is
reusable instructions, and which two rows differ by who chooses the next
step? What changed between the text-only chat and agentic interaction?

**The skill was invoked explicitly with `/fix-test`.** Paste its description and explain what it advertises. Explicit invocation does not test automatic skill selection:

```
```

**The workflow never edited anything.** Which line of `workflow.sh` proves
that the path was fixed by a human in advance?

---

# Part 2 — the supplied Act 2 loop and its labelled trace

**Saved normal-run log:**
**Saved normal-run directory:**
**Saved budget-run log and directory:**

Paste 8–15 representative lines from your Act 2 run. If model access failed, record the actual error and offline tool-demo evidence; identify the missing model-backed observations. Label every line **P** (perceive), **D**
(decide), **A** (act) or **O** (observe), using the lecture's rule:
*Act is every tool call, including Read; Perceive is what the model had in
front of it when the turn began.*

```
[P]
[D]
[A]
[O]
```

**Now name the five parts of this agent with their concrete instance**
(Lecture 1):

| part | the instance in this run |
|---|---|
| goal | |
| model | |
| tools | |
| memory | |
| model end signal (`end_turn`) | |
| harness budget (`MAX_STEPS`) | |
| independent success check (`npm test`) | |

**Act 2 only — when you ran `--max-steps 3`:** what did the loop print,
and which stop signal fired? Did the independent test find the goal complete?

```
```

**The hardest line to label, and why:**

---

# Part 3 — the autonomous run (Act 3)

**Saved Act 3 report directory:**
**Saved verifier log and exit status:**

**The limits I set** (from `docker/run.sh`): `--max-turns` = `--max-budget-usd` =

**What `result.json` reported** — distinguish CLI metadata from result text; classify a final response versus a CLI/API error before attributing it to a model — paste the summary lines `run.sh` printed
(`subtype`, `num_turns`, `total_cost_usd`, `is_error` if present, and the
`result` text). Use `is_error`, `subtype`/`terminal_reason`, stderr and the saved exit status to identify errors; do not attribute an authentication error to a model that was never reached:

```
```

**What `verify.sh` checked independently** — changed source paths, protected file integrity, trusted test result and exit status:

```
```

**Did the claim and the evidence agree?** If not, what was the difference?

**`break-it.sh`** — with a goal that can never check true, what actually stopped the
bot, and how do you know? It may end early, hit a budget or encounter an error. (`subtype` and `num_turns`):

```
```

**One rule from Lecture 1** you saw matter most today,
and the moment you saw it:

**What reduces the risk of bypassing permissions in this lab?** Name the filesystem, budget and verifier boundaries. Explain the remaining runtime-key and network risks; a container is not a guarantee of safety.

---

# Part 4 — the lusql verdict

One paragraph. Choose a concrete task involved in **building lusql**, the SQL engine in the Session 15 capstone. Decide which steps fit a fixed workflow and which require an agent to adapt to feedback. The engine itself is not an agent merely because an agent builds it. Argue from the lecture's three questions
(**fixed path? · must adapt? · recoverable?**) and the three
signatures (**open-ended · needs feedback · many similar sub-tasks**). Say which rung of the ladder (Figure 1.3 in Lecture 1) you would run it on,
and where you would put a human gate.

---

## One thing that surprised me
