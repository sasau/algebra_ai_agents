# Act 2 · prompt lab — the six prompts

One file per step of the lab. Each is **copy-pasteable as-is** into the Claude
Code CLI: open it, copy everything below the `---` line, paste, read the answer,
save it, move to the next file.

| file | what it adds | the part from Figure P0.4 |
|---|---|---|
| `00-baseline.md` | nothing — this is the control | — |
| `01-role.md` | who is speaking, and to whom | 1 · role & audience |
| `02-material.md` | the actual DDL, indexes and row counts | 3 · the material |
| `03-constraints.md` | bounds the shape of the answer | 4 · constraints |
| `04-format.md` | a fixed, machine-readable shape | 5 · output format |
| `05-reasoning.md` | makes the assumptions visible | 6 · show the reasoning |
| `06-politeness.md` | the null test — politeness, nothing else | *(not on the list, deliberately)* |

## How to use these

### ⚠ `/clear` before every single prompt

This is the one rule that makes the lab work, and it is easy to get backwards:

- **The prompt text accumulates.** `01` is the baseline plus a role; `02` is
  that plus the schema; by `05` you are holding a complete prompt assembled one
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
question plus good manners, and it is supposed to produce a *generic* answer.
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

## What you are looking for

Note **which step** the answer stops being generic advice about SQL and starts
naming *your* columns — `DATE(sent_at)`, the missing composite index,
`LOWER(channel)`. For most people that is step `02`, and the size of that jump
compared to every other step is the lesson of the lab.

`06-politeness.md` is there to fail. If it changes the answer's *content* rather
than just its wording, that is genuinely interesting — write it down.

Record all of it in `findings.md`. The case itself — schema, indexes, row
counts — is in [`../slow-query.md`](../slow-query.md).
