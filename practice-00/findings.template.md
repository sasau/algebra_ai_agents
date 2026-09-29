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
one index. The prompts are in `prompts/`, one file per step. The query and the
question never change; only the prompt around them does.

**The baseline answer I got** (`prompts/00-baseline.md`):

```
```

**Then, one part at a time** — `/clear` before each, then tick it once you have
run it and kept the answer:

- [ ] `01-role.md` — role & audience
- [ ] `02-material.md` — the DDL, indexes and row counts pasted in
- [ ] `03-constraints.md` — "three options, ranked"
- [ ] `04-format.md` — `{fix, reason, risk}`
- [ ] `05-reasoning.md` — state the query plan first
- [ ] `06-politeness.md` — the null test (compare against `00`, not `05`)
- [ ] `07-bait.md` — a fake setting, a fake extension, impossible timings
- [ ] `08-permission.md` — `07` + permission to say "that does not exist"
- [ ] `09-models.md` — `05` unchanged, on four model × effort settings

> Did you `/clear` before every one of the nine (`00`–`08`)? If you missed one,
> that answer saw the previous prompt's schema and is not comparable — re-run
> it. Step `09` uses a fresh `claude` per row instead.

**Guesses in the baseline** — what did `00` assume about indexes or data that it
could not know? (e.g. "make sure `account_id` is indexed"):

**At which step did it stop guessing — and name the one index, the 240 M rows,
or the lowercase `channel` as facts?**

**The tweak that changed the answer most, and why I think it did:**

**One thing I expected to help that did nothing:**

**My best answer** (paste it — and name which prompt file produced it):

```
```

### Make it hallucinate (`07`) — and stop it (`08`)

| claim | `07` invented it? | `08` invented it? |
|---|---|---|
| an exact `Execution Time` in ms | | |
| `enable_turbo_scan = on` | | |
| `CREATE EXTENSION pg_fastcount` | | |

**The most confident invented sentence from `07`, quoted exactly:**

```
```

**Something real that `08` offered instead** (a setting, an index, an estimate):

**The hallucination came from the question or from the model? My evidence:**

### Same prompt, different brains (`09`)

| run | caught `DATE(sent_at)`? | caught `LOWER(channel)`? | #1 fix | valid JSON? | time | `/cost` |
|---|---|---|---|---|---|---|
| haiku | | | | | | |
| sonnet · low | | | | | | |
| sonnet · high | | | | | | |
| opus · high | | | | | | |

**Which moved the answer more — going from `00` to `05` on Haiku, or going
from Haiku to Opus on `05`?**

**Was the most expensive run worth paying for on every call? When would it be?**

## The context lab

Six steps in `context/`, run as ONE session. Do **not** `/clear` during
`00`–`03` — the one clear is inside `04`, where the file says.

**`00-floor` — `/context` before typing anything, tokens used:**

**`01-fill` — `/context` after reading the whole src tree, tokens used:**

**What grew, and why that part is the dangerous one:**

**`02-cost` — what `/cost` said, and what it would be with 100 files:**

**`03-ask` → `04-steer` — the same question, before and after `CLAUDE.md`:**

```
before:

after:
```

**The `CLAUDE.md` I wrote:**

```
```

**Did any rule I wrote get ignored?**

**`05-plan-mode` — what it did when asked to delete the java folder, and why
that stop is not the model refusing:**

**One sentence: what is actually in a context window?**

---

# Act 3 — make the agent yours

The steps are in `customize/`, one file per step. Launch `claude` from
`practice-00/` and `/exit` + relaunch between steps — most of these files are
read only at launch.

## Step 01 — CLAUDE.md

**My CLAUDE.md after trimming (paste it — aim for ~15 lines):**

```
```

**`/context` → Memory files, before and after (tokens):**

```
before:          after:
```

**One line I cut from what `/init` wrote, and why it did not belong:**

**Did it answer "Where would I change the model this lab uses?" with the exact
file paths?**

## Step 02 — @imports

**Memory files with `@slow-query.md` imported, vs a plain mention (tokens):**

```
imported:          plain mention:
```

**Did it answer the row-count question without opening a file?**

**An import is one place to maintain — not fewer tokens. When is it worth it?**

## Step 03 — rules

**Was `sql.md` listed in `/context` at launch? After it read `slow-query.md`?**

```
at launch:          after reading slow-query.md:
```

**Which line of `sql.md` visibly changed the review?**

## Step 04 — a script becomes a tool

**Before the tool — the commands Claude ran for "What changed since my last
commit?", and how many permission prompts I got:**

**After the tool (allow rule + CLAUDE.md line) — what it ran instead:**

**Why the CLAUDE.md line matters even though the allow rule already exists:**

## Step 05 — a skill

**The commit message `/commit-message` drafted (paste it):**

```
```

**Did the plain request trigger the skill without the slash command? Which
words in the `description` made that happen?**

## Step 06 — the system prompt

**`/context` → System prompt, three launches (tokens):**

```
plain:          --append-system-prompt:          --system-prompt:
```

**What the `--system-prompt` launch stopped doing that the plain one did:**

**One sentence: why CLAUDE.md, not `--system-prompt`, is where my project rules go:**

---

# Optional — calling the API from code (take-home)

Not run in class. The exercises are in `ts/` and `java/` — README §3. Fill this
in if you do them; `findings.md` is complete without it.

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

## Exercise 7 — same prompt, different brains, from code

**The SUMMARY table it printed (paste it):**

```
```

**Which call first said `DATE(sent_at)` stops the index from being used?**

**A1 vs A2 — what did 2 048 tokens of thinking change on Haiku, and what did
it cost?**

**B1 vs B2 vs C1 — dollars per *correct* recommendation. Which would I ship?**

**B3's `400`, and the one line of `client.ts` / `Client.java` it argues for:**

**D1's most confident invention, quoted — and did D2 fix it?**

---

## One thing that surprised me
