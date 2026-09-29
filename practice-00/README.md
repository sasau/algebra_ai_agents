# Practice 00 — Intro to LLMs

The first lab of *AI Agents & Automation*. In class you make your machine
work, feel how prompts and context change an answer in the Claude Code CLI,
and then configure that agent yourself — a `CLAUDE.md`, rules, a script it
can call as a tool, a skill, and its system prompt.

Everything later in the course is a loop around what you set up today.

The repo also ships **two tracks that run the same five API exercises** (plus
two stretch goals) — TypeScript and Java. In class you use a track only for
the setup check; the exercises are an optional **take-home** (§3).

```
practice-00/
  .env.example              copy to .env and add your key — shared by both tracks
  findings.template.md      copy to findings.md and fill in
  slow-query.md             the Act 2 prompt-lab case: DDL, row counts, the query
  prompts/                  Act 2 lab A — the prompts, one file per step (00–09)
  context/                  Act 2 lab B — the context steps (00–05)
  customize/                Act 3 — make the agent yours, one file per step (01–06)
  tools/git-summary.sh      Act 3 — the shell script you turn into a tool
  ts/                        TypeScript track
    package.json  tsconfig.json  src/*.ts
  java/                       Java track
    build.gradle.kts  settings.gradle.kts  gradlew  gradle/wrapper/  src/main/java/lab/*.java
```

---

## 0. Which track?

Both tracks are deliberately the same program written twice — same prompts,
same exercises, same lessons, same output shape. Pick whichever fits how you
want to spend the lab:

| | TypeScript track (`ts/`) | Java track (`java/`) |
|---|---|---|
| Needs | Node.js 20 LTS or newer, npm | JDK 21 — nothing else |
| Setup | `npm install` | none — the Gradle wrapper self-provisions |
| Run with | `npm run <script>` | `./gradlew <task>` |

Everyone, on either track, also needs **git** and an **Anthropic API key**.
The **Claude Code CLI** is needed for Acts 2 and 3 (below) — not for the
take-home exercises.

---

## 1. Act 1 — make your machine work (~25 min)

Clone the repo, then set up the one shared secret file:

```bash
cd practice-00
cp .env.example .env
```

Open `.env` and replace `sk-ant-REPLACE-ME` with your key from
[console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).

> **One `.env`, at `practice-00/.env`.** It is not inside `ts/` or `java/` —
> both tracks read this exact file (the TypeScript track via `src/env.ts`, the
> Java track via `Client.java`, which looks one directory up from `java/`).
> An `ANTHROPIC_API_KEY` already exported in your shell wins over the file, so
> you can override it per-terminal without editing anything.
>
> **Your key is a password.** It lives in `.env`, which git ignores. Never
> paste it into a source file, a commit, a screenshot, or a chat. If you leak
> one, revoke it in the Console immediately — deleting the commit is not
> enough.

Now install and verify the track you chose **before writing any code**:

```bash
# TypeScript
cd ts
npm install
npm run check

# Java — no install step, the wrapper provisions Gradle and the JDK toolchain itself
cd java
./gradlew checkSetup
```

You want `ALL CHECKS PASSED`. If a check fails it tells you the fix. The most
common failure is a missing or placeholder key.

---

## 2. The three acts

| Act | What | Where | Time |
|---|---|---|---|
| 1 | Make your machine work | this file, §1 above | ~25 min |
| 2 | Prompts & context, explored live | the Claude Code CLI, in agent mode | ~55 min |
| 3 | Make the agent yours | [`customize/`](customize/), in the Claude Code CLI | ~40 min |

The API exercises that used to be Act 3 are now a take-home — §3.

### Act 2 — prompts & context, in agent mode (~55 min)

Before writing any API code, spend time in the Claude Code CLI itself to feel
two things you cannot see from a single API call: how prompt phrasing changes
an answer, and how a context window actually fills up.

- **The prompt lab.** The case is in [`slow-query.md`](slow-query.md): a nightly
  report query that takes 42 seconds and must come in under 2, with its full
  DDL, row counts, and the single index the table actually has.

  **The prompts are written for you** — [`prompts/`](prompts/), one file per
  step, copy-paste ready:

  | file | adds |
  |---|---|
  | `00-baseline.md` | the bare query + "how do I speed it up?" — the control |
  | `01-role.md` | role & audience |
  | `02-material.md` | the DDL, indexes and row counts |
  | `03-constraints.md` | "three options, ranked" |
  | `04-format.md` | `{fix, reason, risk}` JSON |
  | `05-reasoning.md` | "state the query plan first" |
  | `06-politeness.md` | the null test — politeness and nothing else |
  | `07-bait.md` | asks about a setting and an extension that do not exist |
  | `08-permission.md` | `07` + permission to say "that does not exist" |
  | `09-models.md` | `05` unchanged — rerun it under haiku, sonnet, opus and two efforts |

  Run them in order and keep every answer. **`/clear` before every prompt** —
  each file holds the complete prompt, so the *text* accumulates but the
  *conversation* must not; otherwise the schema from step 2 leaks forward and
  every later answer is contaminated. Every prompt includes the query; note
  which step made the answer stop guessing about the *database* (indexes, row
  counts, data) and start stating facts about it. Do **not** improve `00`
  or `06` — they are controls, and editing them destroys the measurement.
  Steps `07`–`08` make the model hallucinate and then stop it; step `09`
  holds the prompt still and changes the model (`claude --model …
  --effort …`) — the file has the exact commands and a table to fill in.
- **The context lab.** Six steps in [`context/`](context/), run as **one
  continuous session**:

  | file | what you do |
  |---|---|
  | `00-floor.md` | `/context` before typing — the window is never empty |
  | `01-fill.md` | read the whole `src/` tree, then measure again |
  | `02-cost.md` | `/cost` — and why it is worse than linear |
  | `03-ask.md` | "what does this project do?" — the control |
  | `04-steer.md` | write `CLAUDE.md`, `/clear`, re-ask unchanged |
  | `05-plan-mode.md` | `shift+tab`, then something destructive |

  ⚠ **The clearing rule is the opposite of the prompt lab.** Here you must
  *not* clear — steps `00`–`03` grow one window on purpose, and clearing
  resets the measurement. There is exactly **one** `/clear`, inside `04`,
  where the file says.

`findings.md` asks you to record what you saw in both labs — see §5.

### Act 3 — make the agent yours (~40 min)

Act 2 steered an agent someone else configured. Act 3 configures it. Six
steps in [`customize/`](customize/) — start with its
[README](customize/README.md), which has the load-order table:

| file | what you build | where it goes |
|---|---|---|
| `01-claude-md.md` | the briefing every session starts from | `CLAUDE.md` |
| `02-imports.md` | link a doc instead of pasting it | `@slow-query.md` in `CLAUDE.md` |
| `03-rules.md` | rules by topic, one loaded only for SQL files | `.claude/rules/git.md`, `sql.md` |
| `04-tool.md` | a shell script Claude may run as a tool | `tools/git-summary.sh` + `.claude/settings.json` |
| `05-skill.md` | a procedure loaded only when needed | `.claude/skills/commit-message/SKILL.md` |
| `06-system-prompt.md` | add to the system prompt, then replace it | `--append-system-prompt`, `--system-prompt` |

Launch `claude` from `practice-00/`, and `/exit` + relaunch between steps —
most of these files are read only at launch. A finished copy of every file
is in [`customize/solution/`](customize/solution/); read it after you have
written your own, not before.

`CLAUDE.md` and `.claude/settings.json` are meant to be committed — they are
the team's shared setup. `CLAUDE.local.md` and `.claude/settings.local.json`
are personal and git-ignored.

---

## 3. Take-home — call the API from your own code

**Optional, not run in class.** The same model you used through the CLI,
called from a program you can read. Run them in order — each builds on the
last.

| # | Command (TypeScript) | Command (Java) | What you'll see |
|---|---|---|---|
| **1** | `npm run ex1` | `./gradlew ex1` | Prompt in → text out → the token meter |
| **2** | `npm run ex2` | `./gradlew ex2` | The model has no memory. You build it — and watch it get expensive |
| **3** | `npm run ex3` | `./gradlew ex3` | `temperature` and `max_tokens`, plus a parameter that was removed |
| **4** | `npm run ex4` | `./gradlew ex4` | A system prompt that forces JSON, and a hallucination in valid JSON |
| **7** | `npm run ex7` | `./gradlew ex7` | One prompt, three models, thinking and effort — tokens, time and dollars per call |

Exercise 7 is numbered after the two stretch scripts (`05`, `06`) because it
was added later; run it **after** Exercise 4. It calls Sonnet 5 and Opus 5, so
one run costs roughly $0.10–0.30 — run it once, not in a loop.

Or run the first four in one go: TypeScript has `npm run all` (chains ex1–ex4 —
Exercise 7 is left out on purpose, because of what it costs); on
the Java track, run the four `./gradlew exN` tasks in order (there is no
combined task).

Java's `-Pex` form works too, if you prefer it: `./gradlew run -Pex=1`
accepts `check`, `1`, `2`, `3`, `4`, `7`, `stream`, `chat` — the named tasks
(`./gradlew ex1`, `./gradlew stretchStream`, …) do the same thing and are
easier to remember.

**Read the source.** Every file is commented to explain *why*, not just what.
The code is the lesson; the output is the evidence. `client.ts` /
`Client.java` is the one file to read first — model ids and the client both
live there, nowhere else.

### What each exercise is really teaching

1. **`01-first-call.ts` / `Ex01FirstCall.java`** — the model is a pure
   function. Text in, text out, no state. `usage` is the meter that bills you.
   The exercise checks the lecture's "~¾ word per token" rule of thumb against
   the real counts.
2. **`02-conversation.ts` / `Ex02Conversation.java`** — "memory" is not a
   model feature. Part A fires two separate calls and shows the second one has
   no idea the first happened; Part B carries the same history yourself in a
   growing array/list and shows what re-sending it costs. This is the problem
   Sessions 08 and 11 exist to solve.
3. **`03-knobs.ts` / `Ex03Knobs.java`** — `temperature 0` twice vs
   `temperature 1` twice, to feel determinism vs variety; a capped
   `max_tokens` to see a reply cut off mid-thought with a `stop_reason` you
   must check. Part C sends `temperature` to `claude-sonnet-5` on purpose and
   catches the resulting `400` — the frontier models removed the sampling
   knobs, and Haiku 4.5 is pinned here specifically because it still has them.
   Model ids live in exactly one place (`client.ts` / `Client.java`) so this
   kind of change is a one-line fix, not a hunt across twenty call sites.
4. **`04-json.ts` / `Ex04Json.java`** — structured output is what turns an LLM
   into a *component*. Part A shows prose a human reads fine but
   `JSON.parse`/Jackson would choke on; Part B adds a system prompt that
   forces valid JSON. A tool call (Session 02) is just JSON the model produced
   and your code ran — but Part D shows that valid JSON can still be
   confidently wrong (a hallucination that parses cleanly).
7. **`07-models.ts` / `Ex07Models.java`** — the model is a *parameter*, and
   so is how hard it tries. The Act 2 winning prompt goes to Haiku 4.5 with
   thinking off and on (`budget_tokens`), to Sonnet 5 at effort `low` and
   `high`, and to Opus 5 — each call prints its latency, output tokens, how
   many of those were thinking, and its cost. Part B sends `budget_tokens` to
   Sonnet 5 on purpose and catches the `400`: the frontier models replaced it
   with `output_config.effort`, the same kind of break as Exercise 3's
   `temperature`. Part D asks about a PostgreSQL setting and an extension that
   do not exist, then asks again with permission to say so — two sentences of
   prompt usually fix what a bigger model does not.

### Stretch goals (optional)

| TypeScript | Java | What it does |
|---|---|---|
| `npm run stretch:stream` | `./gradlew stretchStream` | Watch tokens arrive live; measure time-to-first-token |
| `npm run stretch:chat` | `./gradlew stretchChat` | A small chatbox with `/tokens`, `/reset`, `/quit` |

Both are Exercise 2's history-array loop wearing a REPL.

---

## 4. The pinned model, and why

Model ids live in exactly **one module per track** — `ts/src/client.ts` and
`java/src/main/java/lab/Client.java` — and nowhere else. Both pin
`claude-haiku-4-5` deliberately:

- `temperature`, `top_p` and `top_k` have been **removed** from the current
  frontier models. Sending a non-default `temperature` to `claude-sonnet-5`
  or `claude-opus-5` returns **HTTP 400**. Exercise 3 Part C triggers exactly
  this 400, on purpose, as the lesson.
- Haiku 4.5 is the only current model that still accepts `temperature`, which
  is what Exercise 3 needs to demonstrate the knob at all.
- The takeaway is **not** "always use Haiku" — it is that a parameter you
  depend on can vanish in the next model generation, so the model id and its
  quirks belong in one file, not scattered across every call site.

Do not "upgrade" the pinned model to make the 400 go away — the 400 is the
point.

The same module also holds `BIG_MODEL` (`claude-sonnet-5`), `OPUS_MODEL`
(`claude-opus-5`) and a `PRICING` table (dollars per million input / output
tokens) that Exercise 7 uses to print what each call cost. **"Try harder" is
spelled differently per model**, which is the second quirk that belongs in
this one file:

| model | how you ask it to think | what 400s |
|---|---|---|
| `claude-haiku-4-5` | `thinking: {type: "enabled", budget_tokens: N}` (N ≥ 1024, < `max_tokens`) | — |
| `claude-sonnet-5`, `claude-opus-5` | `thinking: {type: "adaptive"}` + `output_config: {effort: "low" … "max"}` | `budget_tokens`, `temperature` |

Thinking tokens are billed as **output** tokens — a call that "tries hard"
can cost several times one that does not, for the same visible answer.

**Java compile note:** building the Java track prints
`warning: [deprecation] temperature(double) in Builder has been deprecated`.
This is expected, not a mistake you made — the SDK deprecated the knob for the
same reason the API removed it from the frontier models. It is part of the
lesson in Exercise 3, not a regression to fix.

### Dependencies are pinned exactly

Both `ts/package.json` and `java/build.gradle.kts` pin exact versions — never
`^`/`+` ranges. The internal npm mirror blocks packages published less than
three days old, so a caret range can resolve to a version that 403s for the
whole class mid-lab. Bump versions deliberately, not by accident.

---

## 5. Submit (end of Act 3)

```bash
cp findings.template.md findings.md
```

Fill it in — it is graded on observation, not on being right. It covers all
three acts: the setup check output, what you found in the Act 2 prompt and
context labs, and what `/context` showed at each Act 3 step. The take-home
section at the end is optional. Then check:

- [ ] The setup check passes (`npm run check` or `./gradlew checkSetup`)
- [ ] `findings.md` completed for all three acts
- [ ] Your `CLAUDE.md` and `.claude/` (rules, `settings.json`, the
      `commit-message` skill) exist in `practice-00/`
- [ ] Your name and which track you ran at the top of `findings.md`
- [ ] **No key in any committed file** — `git status` shows `findings.md`,
      `CLAUDE.md` and `.claude/`, never `.env`
- [ ] *(take-home, optional)* Exercises 1–4 and 7 run without errors

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `ANTHROPIC_API_KEY is not set` | no `.env`, or it has the placeholder | `cp .env.example .env` in `practice-00/`, add your real key |
| `401` from the API | key is wrong, revoked, or has a stray space | re-copy it from the Console |
| `429` | rate limited — the whole class is calling at once | wait a few seconds, retry |
| `400 ... credit balance` | account has no credit | add credit in the Console |
| `temperature` 400 error | you pointed a script at a frontier model | expected — see §4; those models removed the knob |
| **TypeScript** — `Cannot find module` | dependencies not installed | run `npm install` from `ts/` |
| **TypeScript** — check fails on Node version | Node older than 20 | install Node 20 LTS or newer |
| **Java** — `permission denied` running `./gradlew` | the wrapper script lost its executable bit (common after some zip/clone tools) | `chmod +x gradlew`, run again |
| **Java** — check fails on Java version, or Gradle can't find a JDK | `JAVA_HOME` points at a JDK below 21, or none is set | install JDK 21 (e.g. Temurin) and point `JAVA_HOME` at it — the build's toolchain also auto-downloads a matching JDK if needed |
| **Java** — `warning: [deprecation] temperature(double) ...` during build | expected | not an error — see §4, it's part of the Exercise 3 lesson |
| `400 ... budget_tokens` / `thinking.type.enabled` | `budget_tokens` sent to Sonnet 5 or Opus 5 | expected in Exercise 7 Part B — those models take `output_config.effort` instead |
| **Java** — `Unknown -Pex=...` | typo in `-Pex` value | use one of `check,1,2,3,4,7,stream,chat`, or use the named task (`./gradlew ex1`) instead |

---

## Files

```
practice-00/
  .env.example              copy to .env and add your key — shared by both tracks
  findings.template.md      copy to findings.md and fill in
  slow-query.md             the Act 2 prompt-lab case: DDL, row counts, the query
  prompts/                  Act 2 lab A — the prompts, one file per step (00–09)
  context/                  Act 2 lab B — the context steps (00–05)
  customize/                Act 3 — the six steps (01–06) + README
    solution/                 a finished CLAUDE.md, rules, settings.json and skill
  tools/
    git-summary.sh            read-only repo snapshot — the Act 3 tool

  ts/
    package.json              npm scripts (see table above)
    tsconfig.json
    src/
      client.ts               shared client + model ids + helpers  ← read this first
      env.ts                  loads the shared ../.env
      00-check-setup.ts        environment verification
      01-first-call.ts         exercise 1
      02-conversation.ts       exercise 2
      03-knobs.ts              exercise 3
      04-json.ts               exercise 4
      05-stretch-stream.ts     stretch: streaming
      06-stretch-chat.ts       stretch: a chat loop
      07-models.ts             exercise 7: models, thinking, effort, hallucination

  java/
    build.gradle.kts          Gradle tasks (see table above)
    settings.gradle.kts
    gradlew, gradlew.bat, gradle/wrapper/   self-provisioning wrapper — no local Gradle install needed
    src/main/java/lab/
      Client.java              shared client + model ids + helpers  ← read this first
      CheckSetup.java          environment verification
      Ex01FirstCall.java       exercise 1
      Ex02Conversation.java    exercise 2
      Ex03Knobs.java           exercise 3
      Ex04Json.java            exercise 4
      Ex05StretchStream.java   stretch: streaming
      Ex06StretchChat.java     stretch: a chat loop
      Ex07Models.java          exercise 7: models, thinking, effort, hallucination
```
