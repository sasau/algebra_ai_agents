# Practice 00 — Intro to LLMs

The first lab of *AI Agents & Automation*. By the end you will have made a real
API call, built a conversation by hand, turned the sampling knobs, and forced
the model to return machine-readable output.

Everything later in the course is a loop around what you build today.

This practice ships **two tracks that run the same four exercises** (plus two
stretch goals) — TypeScript and Java. Pick one and work it end to end.

```
practice-00/
  .env.example              copy to .env and add your key — shared by both tracks
  findings.template.md      copy to findings.md and fill in
  slow-query.md             the Act 2 prompt-lab case: DDL, row counts, the query
  prompts/                  the Act 2 prompts, one file per step (00–06)
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
The **Claude Code CLI** is needed for Act 2 (below) — not for the exercises
themselves.

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
| 2 | Prompts & context, explored live | the Claude Code CLI, in agent mode | ~40 min |
| 3 | Call the API from your own code | your chosen track, below | ~35 min |

### Act 2 — prompts & context, in agent mode (~40 min)

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
  | `00-baseline.md` | nothing — the control, deliberately bad |
  | `01-role.md` | role & audience |
  | `02-material.md` | the DDL, indexes and row counts |
  | `03-constraints.md` | "three options, ranked" |
  | `04-format.md` | `{fix, reason, risk}` JSON |
  | `05-reasoning.md` | "state the query plan first" |
  | `06-politeness.md` | the null test — politeness and nothing else |

  Run them in order and keep every answer; the prompt accumulates. Note which
  step made the answer stop being generic advice and start naming your columns.
  Do **not** improve `00` or `06` — they are controls, and editing them
  destroys the measurement.
- **The context lab.** Run `/context` right after starting `claude`, then
  again after five or six turns, and watch what grew. Edit `CLAUDE.md` and ask
  the same question again to see the answer change. Check `/cost` at the end
  of the session.

`findings.md` asks you to record what you saw in both labs — see §5.

### Act 3 — the four exercises (~35 min)

Run them in order — each builds on the last.

| # | Command (TypeScript) | Command (Java) | What you'll see |
|---|---|---|---|
| **1** | `npm run ex1` | `./gradlew ex1` | Prompt in → text out → the token meter |
| **2** | `npm run ex2` | `./gradlew ex2` | The model has no memory. You build it — and watch it get expensive |
| **3** | `npm run ex3` | `./gradlew ex3` | `temperature` and `max_tokens`, plus a parameter that was removed |
| **4** | `npm run ex4` | `./gradlew ex4` | A system prompt that forces JSON, and a hallucination in valid JSON |

Or run all four in one go: TypeScript has `npm run all` (chains ex1–ex4); on
the Java track, run the four `./gradlew exN` tasks in order (there is no
combined task).

Java's `-Pex` form works too, if you prefer it: `./gradlew run -Pex=1`
accepts `check`, `1`, `2`, `3`, `4`, `stream`, `chat` — the named tasks
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

---

## 3. Stretch goals (optional)

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

## 5. Submit (~13 min)

```bash
cp findings.template.md findings.md
```

Fill it in — it is graded on observation, not on being right. It covers all
three acts: the setup check output, what you found in the Act 2 prompt and
context labs, and your answers for each of the four exercises. Then check:

- [ ] The setup check passes (`npm run check` or `./gradlew checkSetup`)
- [ ] All four exercises run without errors
- [ ] `findings.md` completed for all three acts
- [ ] Your name and which track you ran at the top of `findings.md`
- [ ] **No key in any committed file** (`git status` shows no `.env`)

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
| **Java** — `Unknown -Pex=...` | typo in `-Pex` value | use one of `check,1,2,3,4,stream,chat`, or use the named task (`./gradlew ex1`) instead |

---

## Files

```
practice-00/
  .env.example              copy to .env and add your key — shared by both tracks
  findings.template.md      copy to findings.md and fill in
  slow-query.md             the Act 2 prompt-lab case: DDL, row counts, the query
  prompts/                  the Act 2 prompts, one file per step (00–06)

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
```
