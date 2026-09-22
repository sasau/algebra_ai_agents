# Practice 00 — findings

**Name:**
**Date:**
**Track I ran:** TypeScript / Java  *(delete one)*
**Model used:** `claude-haiku-4-5`

> Copy this file to `findings.md` and fill it in as you go.
> `cp findings.template.md findings.md`

---

# Act 1 — environment

**Output of the setup check (paste the last three lines):**

```
```

**Anything that failed the first time, and what fixed it:**

---

# Act 2 — prompts & context, in agent mode

## The prompt lab

The case is in `slow-query.md` — the 42-second report query, its DDL, and its
one index. The prompts are in `prompts/`, one file per step. The question never
changes; only the prompt around it does.

**The baseline answer I got** (`prompts/00-baseline.md`):

```
```

**Then, one part at a time** — tick each once you have run it and kept the answer:

- [ ] `01-role.md` — role & audience
- [ ] `02-material.md` — the DDL, indexes and row counts pasted in
- [ ] `03-constraints.md` — "three options, ranked"
- [ ] `04-format.md` — `{fix, reason, risk}`
- [ ] `05-reasoning.md` — state the query plan first
- [ ] `06-politeness.md` — the null test (compare against `00`, not `05`)

**At which step did the answer stop being generic and start naming my columns?**

**The tweak that changed the answer most, and why I think it did:**

**One thing I expected to help that did nothing:**

**My best answer** (paste it — and name which prompt file produced it):

```
```

## The context lab

**`/context` right after `claude` started — tokens used:**

**`/context` after five or six turns — tokens used:**

**What grew, and why:**

**What `/cost` said at the end of the session:**

**After I edited `CLAUDE.md` and asked the same question again, the answer changed like this:**

```
before:

after:
```

**One sentence: what is actually in a context window?**

---

# Act 3 — calling the API from code

## Exercise 1 — first call & the token meter

**Tokens-per-word ratio I measured:**

**Did two runs of the same prompt return identical text?**

**`input_tokens` was larger than my prompt's word count. My explanation:**

---

## Exercise 2 — statelessness & context growth

**Part A — what the second, separate call answered when I asked "What is my name?":**

```
```

**Part C — my token growth curve (paste the numbers):**

```
turn 1 → turn 2 → turn 3 → turn 4 → turn 5
```

**Is the growth linear or worse? What does that mean for a 50-turn conversation?**

**Roughly how many turns until a 200K context window is full, at this rate?**

**How this matches what I watched `/context` do in Act 2:**

---

## Exercise 3 — temperature & max_tokens

**temperature 0, two runs:**

```
run 1:
run 2:
identical?
```

**temperature 1, two runs:**

```
run 1:
run 2:
identical?
```

**`stop_reason` when I capped the output at 30 tokens:**

**What would have gone wrong if my code had used that truncated text without checking `stop_reason`?**

**What happened when I sent `temperature` to `claude-sonnet-5`, and what I take from that:**

---

## Exercise 4 — JSON output

**Part A (no system prompt) vs Part B (with one) — what changed:**

```
without:

with:
```

**Did my reply need the code-fence stripping in the defensive parser?**

**The hallucination I caught (Part D) — pasted exactly:**

```
```

**Why "valid JSON" and "true" are not the same thing:**

---

## One thing that surprised me
