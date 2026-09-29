# Step 9 — same prompt, different brains

**What changed from step 5:** nothing in the prompt. This step re-runs
`05-reasoning.md` word for word and changes the **model** and the **effort**
instead — so any difference you see comes from the brain, not the words.

**Why it matters:** steps 0–6 showed that what you *say* moves the answer.
This step measures how much the *model* moves it, on a prompt that is already
good. Usually the answer is: less than the material did, and at a very
different price.

## How to run it

Leave the session you are in (`/exit`) and start a fresh one per row. The
flags pin the model and the effort for the whole session; `--tools ""` stops
the agent from reading `slow-query.md` on its own, so every run gets exactly
the prompt and nothing else.

```bash
cd algebra_ai_agents/practice-00

claude --model haiku  --tools ""                 # row 1 — the lab's default
claude --model sonnet --effort low  --tools ""   # row 2
claude --model sonnet --effort high --tools ""   # row 3
claude --model opus   --effort high --tools ""   # row 4 — the top of the range
```

In each session: paste `05-reasoning.md` (everything below its `---`), wait
for the answer, then run `/cost`. Press `ctrl+o` to open the transcript and
see how much the model *thought* before it answered. Then `/exit`.

You can also switch inside one session with `/model` and `/effort` — but then
run `/clear` after every switch, for the same reason as the rest of this lab.

## What to watch

Fill in this table in `findings.md`:

| run | caught `DATE(sent_at)`? | caught `LOWER(channel)`? | #1 fix | valid JSON? | time | `/cost` |
|---|---|---|---|---|---|---|
| haiku | | | | | | |
| sonnet · low | | | | | | |
| sonnet · high | | | | | | |
| opus · high | | | | | | |

The three defects are on slide 19 and in `slow-query.md`. The strongest
answers name a composite index led by `account_id` and `sent_at`, rewrite
`DATE(sent_at) BETWEEN …` as a half-open range
(`sent_at >= '2026-09-01' AND sent_at < '2026-09-22'`), and drop the
pointless `LOWER()`. A weaker answer says "add an index on `sent_at`" — true,
and nowhere near under 2 s on a 240 M-row table.

**The question to answer:** was the most expensive run the best one? Was it
*enough* better to pay for it on every call — or only on the hard ones?

Exercise 7 (`npm run ex7` / `./gradlew ex7`) does the same comparison from
code, and prints the tokens, the thinking tokens and the dollars per call.

> **`/clear` first** — or here, a fresh `claude` per row.

---

*(paste the prompt from `05-reasoning.md` — unchanged)*
