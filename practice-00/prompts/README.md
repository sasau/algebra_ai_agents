# Act 2 · prompt lab — the ten prompts

One file per step of the lab. Each is **copy-pasteable as-is** into the Claude
Code CLI: open it, copy everything below the `---` line, paste, read the answer,
save it, move to the next file.

| file | what it adds | the part from Figure P0.4 |
|---|---|---|
| `00-baseline.md` | the bare query + the question — the control | — |
| `01-role.md` | who is speaking, and to whom | 1 · role & audience |
| `02-material.md` | the actual DDL, indexes and row counts | 3 · the material |
| `03-constraints.md` | bounds the shape of the answer | 4 · constraints |
| `04-format.md` | a fixed, machine-readable shape | 5 · output format |
| `05-reasoning.md` | makes the assumptions visible | 6 · show the reasoning |
| `06-politeness.md` | the null test — politeness, nothing else | *(not on the list, deliberately)* |
| `07-bait.md` | a question about things that do not exist | *(the failure mode: hallucination)* |
| `08-permission.md` | `07` + permission to say "I don't know" | 4 · constraints, aimed at honesty |
| `09-models.md` | `05` unchanged — change the **model** and **effort** instead | *(the brain, not the words)* |

## How to use these

### ⚠ `/clear` before every single prompt

This is the one rule that makes the lab work, and it is easy to get backwards:

- **The prompt text accumulates.** `00` is the bare query and the question;
  `01` adds a role; `02` adds the schema; by `05` you are holding a complete prompt assembled one
  deliberate piece at a time. Each file already contains the *whole* prompt —
  there is nothing to paste in front of it.
- **The conversation must NOT accumulate.** If you paste `03` into the same
  session that already answered `02`, the model can still see the schema from
  its history. You are then measuring a conversation, not a prompt, and every
  step after the first is contaminated.

```bash
cd algebra_ai_agents/practice-00
claude

# for each file, in order:
/clear                              # ← throw the previous turn away
# then paste the whole prompt from prompts/NN-….md
```

**`06-politeness.md` is where forgetting this hurts most.** It is the bare
query plus good manners, and it is supposed to produce the same *guessing*
answer as `00`.
Run it without clearing and the model still remembers your schema from step 2,
so it answers specifically — and you will conclude that politeness worked. It
did not. You just forgot to `/clear`.

If you are unsure whether a session is clean, run `/context` — a freshly
cleared window shows only the system prompt and tool definitions.

### Three rules that make this a lab rather than a demo

1. **`/clear` between every prompt.** See above.
2. **Run them in order**, and keep every answer. The comparison is the finding;
   the individual answers are not.
3. **Do not improve a prompt because it looks wrong.** `00-baseline.md` is
   deliberately bad and `06-politeness.md` is deliberately useless. They are
   controls. Changing them destroys the measurement.

### Steps 7–9 run differently

- **`07` and `08` are a pair.** Same bait, then the same bait plus two
  sentences. `/clear` between them, exactly as before, or the second answer
  inherits the first one's pushback.
- **`09` changes the session, not the prompt.** Leave with `/exit` and start
  one fresh `claude` per row — `claude --model haiku|sonnet|opus`, with
  `--effort low|high` on the two bigger ones and `--tools ""` so the agent
  cannot open `slow-query.md` by itself. The file has the exact commands and
  the table to fill in.

## What you are looking for

Every prompt from `00` on contains the query, so the model can always see
`DATE(sent_at)` — it is in the SQL. What it cannot see until `02` is the
database: that the only index is on `contact_id`, that `messages` has 240 M
rows, and that `channel` is already lowercase. Note **which step** the answer
stops *guessing* about those and starts stating them — the missing composite
on `(account_id, sent_at)`, the pointless `LOWER(channel)`. For most people
that is step `02`, and the size of that jump compared to every other step is
the lesson of the lab.

`07-bait.md` is there to be believed. Count how many of its three impossible
requests the answer satisfies anyway — then see how many `08` still does.
`09` asks the expensive question: was the most capable model *enough* better,
on a prompt that was already good, to pay for it?

`06-politeness.md` is there to fail. If it changes the answer's *content* rather
than just its wording, that is genuinely interesting — write it down.

Record all of it in `findings.md`. The case itself — schema, indexes, row
counts — is in [`../slow-query.md`](../slow-query.md).
