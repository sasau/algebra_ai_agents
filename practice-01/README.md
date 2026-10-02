# Practice 01 — What are agents?

The second lab of *AI Agents & Automation*. The lecture gave you five words —
**tool · skill · workflow · agent · agentic mode** — that people use as if
they were interchangeable. Today you make them concrete by fixing **one failing
test**, `SELECT * FROM t WHERE x = 1` →
`ParseException: unexpected token WHERE at 1:17`, several different ways, and
noticing who picks each next step. Then you run a ~60-line agent loop you can
read end to end, and finally let a bot work unattended inside a Docker
container and check its claims from outside.

Your deliverable is `agent-anatomy.md`, in four parts: the five words from your
own runs · a labelled trace · the autonomous run · a verdict on whether lusql
(the SQL engine you build in Session 15) is agent-shaped.

```
practice-01/
  .env.example                copy to .env and add your key — read by ts/ and java/, passed into Docker
  agent-anatomy.template.md   copy to agent-anatomy.md and fill in — four parts
  parser-java/                Act 1 target — a mini SQL parser (Java 21) shipped with one red test
  parser-ts/                  Act 2 + 3 target — the same bug in TypeScript; tests run in ~2 s
  ts/                         Act 2, TypeScript track — the agent loop, written by hand
  java/                       Act 2, Java track — the same loop
  docker/                     Act 3 — the fully autonomous bot, in a box
```

---

## 0. Which track?

Only **Act 2** has two tracks. Acts 1 and 3 are the same for everyone. The two
loops are the same program written twice — same goal, same three tools, same
printed trace — so pick whichever language you would rather read.

| | TypeScript track (`ts/`) | Java track (`java/`) |
|---|---|---|
| The loop is written in | TypeScript (Node 20+ is enough for the loop itself) | Java 21 |
| Run with | `npm run agent` | `./gradlew agent` |
| Setup check | `npm run check` | `./gradlew checkSetup` |

Whichever track you pick, **the machine needs all of these**, because the
targets are in two languages:

- **JDK 21** — `parser-java/`, the Act 1 target, is Java.
- **Node.js 22 LTS** and npm — `parser-ts/`, the Act 2 and 3 target, is TypeScript,
  and its test runner (vitest 5) requires Node 22.12 or newer. The loop on
  either track runs `npm test` there, and Act 3's `run.sh` uses `node` on your
  host to print its summary. On Node 20 the loop starts but `npm test` may not.
- **git**, and an **Anthropic API key**.
- **The Claude Code CLI** — Act 1, on your machine (`workflow.sh` calls
  `claude`). Act 3 uses the copy installed inside the Docker image, so your
  host needs it there only for the optional stretch.
- **Docker Desktop or Docker Engine** — Act 3 only.

---

## 1. Setup (~10 min)

Clone the repo and create the one shared secret file:

```bash
git clone https://github.com/sasau/algebra_ai_agents
cd algebra_ai_agents/practice-01
cp .env.example .env
```

Open `.env` and replace `sk-ant-REPLACE-ME` with your key from
[console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys).

> **One `.env`, at `practice-01/.env`.** It is not inside `ts/`, `java/` or
> `docker/` — the TypeScript loop reads it through `src/env.ts`, the Java loop
> through `Client.java` (one directory up from `java/`), and Act 3's `run.sh`
> passes the key into the container with `docker run -e`, so it is never baked
> into the image. An `ANTHROPIC_API_KEY` already exported in your shell wins
> over the file.
>
> **Your key is a password.** It lives in `.env`, which git ignores. Never
> paste it into a source file, a commit, a screenshot, or a chat. If you leak
> one, revoke it in the Console immediately — deleting the commit is not
> enough.

Install the Act 2 / 3 target **first** — the setup check below looks for its
`node_modules` — then install and check the track you chose:

```bash
# from practice-01/ — the target, needed by both tracks
cd parser-ts && npm install && npm test; cd ..   # expect RED: 1 failed | 4 passed (5)

# TypeScript track
cd ts && npm install && npm run check

# Java track — no install step; the wrapper downloads Gradle on first use
cd java && ./gradlew checkSetup
```

You want `ALL CHECKS PASSED — you are ready. Start with: npm run agent` (or
`./gradlew agent`). A missing Docker shows as a `!` warning, not a failure —
you do not need it until Act 3.

Now confirm the Act 1 target is **red**, as shipped:

```bash
# from practice-01/
cd parser-java && ./gradlew test --tests ParserTest
```

You should see these five lines among the output (Gradle also prints the full
stack trace after the first one):

```
ParserTest > parsesWhereClause() FAILED
    lusql.parser.ParseException: unexpected token WHERE at 1:17
ParserTest > parsesSelectStar() PASSED
2 tests completed, 1 failed
BUILD FAILED
```

That red test is the whole lab. `parsesSelectStar` passes on purpose, so a bot
cannot "fix" anything by deleting everything. Last, two one-liners:
`claude --version` must print a version, and `docker info` must print server
details rather than `Cannot connect to the Docker daemon`.

---

## 2. The three acts

| Act | What | Where | Time |
|---|---|---|---|
| 1 | The five words, hands-on | `parser-java/` + the Claude Code CLI | ~35 min |
| 2 | The loop, written by hand | `ts/` or `java/`, against `parser-ts/` | ~25 min |
| 3 | The bot in a box | `docker/` | ~35 min |

### Act 1 — the five words, hands-on (~35 min)

Work in `parser-java/`. You fix the same red test six ways and ask each time:
**who picked the next step?** Between rows, put the bug back from a second
terminal, so an open `claude` session is undisturbed:

```bash
git checkout -- src/main
```

**1. tool.** You run it; nothing decides anything.

```bash
./gradlew test --tests ParserTest
```

```
ParserTest > parsesWhereClause() FAILED
    lusql.parser.ParseException: unexpected token WHERE at 1:17
ParserTest > parsesSelectStar() PASSED
2 tests completed, 1 failed
BUILD FAILED
```

**2. skill.** A skill is a folder with a `SKILL.md`: the frontmatter says
*when*, the body says *how*. Start a session, then call it:

```bash
claude --permission-mode default
```

```
/fix-test ParserTest
```

Why `--permission-mode default`: since v2.1.283 plain `claude` starts in
**Auto**, which edits without asking, and you would never meet the approval
prompts that rows 5 and 6 are about. `default` (shown as *Manual*) asks before
every edit. Until the skill runs, only its `description` sits in the model's
context, and that sentence is what the model matches against your request:

> Fix one failing Gradle test without editing the test itself. Use when a test
> is red and the user wants the source fixed, not the test.

You should end on these two lines. Gradle prints **no count line** on success;
the success test is `BUILD SUCCESSFUL`.

```
ParserTest > parsesWhereClause() PASSED
BUILD SUCCESSFUL
```

Leave the session open for rows 4 and 5.

**3. workflow.** Reset, then, in the second terminal:

```bash
./workflow.sh
```

You see `== workflow: ParserTest is RED ==`, a two-line summary written by the
model, and a pointer to `.workflow-out.txt`. The script exits **1**: it reports,
it does not fix. It is a workflow because *your code drew every arrow* — run the
test, if red ask the model, report and stop. The model is one step in the
middle, reading Gradle's output on stdin; it cannot re-route, pick another
test, call a tool or edit a file (see the comment at the top of `workflow.sh`).
It needs `claude` on your `PATH` and your key; it does not read `.env`, so run
`set -a; . ../.env; set +a` first.

**4. chat.** Reset. In the open session, paste the failure from row 1 and ask:

```
Explain this failure and show me the fix. Do not edit anything.
```

The model answers; **you** apply the fix by hand, then rerun row 1's command.

**5. agent.** Reset. Same session, give it the goal and nothing else:

```
Make ./gradlew test --tests ParserTest pass. Do not edit anything under src/test/. Stop when it is green.
```

Now the model chooses what to read, run and change. This is rung 2, *approve
each action*: approve each one, and **deny anything under `src/test/`** — a test
edited to pass proves nothing. You should reach `ParserTest >
parsesWhereClause() PASSED` and `BUILD SUCCESSFUL`. Then select all in the
terminal and paste the scrollback into `transcript.txt` in `practice-01/`; part 2
needs it.

**6. agentic mode.** Not another run: it is the moment inside row 5 when the
session stopped *answering* and started *acting* — your first permission
prompt. Note which action it was.

**Write now: part 1** of `agent-anatomy.md` — the six rows, from what you
observed, and the "one column" sentence. Keep `transcript.txt` for part 2.

### Act 2 — the loop, written by hand (~25 min)

Pick your track; it is the same program twice. From `practice-01/`:

```bash
cd ts   && npm run agent        # TypeScript
cd java && ./gradlew agent      # Java
```

The loop first resets `parser-ts/src` with `git checkout`, so every run starts
from the same bug and **any edit of yours there vanishes**. If git does not
track `parser-ts/` (practice-01 is not committed yet, or you work from a copy of
the folder), you get a harmless `pathspec` warning and the loop carries on with
the files as they are.

The printed lines are a labelled trace:

- `[P]` perceive — the goal, printed once at the start.
- `[D]` decide — the text the model wrote before asking for tools.
- `[A] › read_file(path: "src/parser.ts")` act — **every** tool call, including
  `read_file`; Act is not only the edits.
- `[O]` observe — the first three lines of what came back.

There are three tools — `read_file`, `write_file`, `run_tests` — jailed to
`parser-ts/`, and `write_file` **refuses anything under `test/`**: the goal
asks for that, the harness enforces it, and only the second holds when the model
decides otherwise.

The stopping condition has two halves. **Success:** the model answers with text
and no tool call, and the loop prints `[D] goal met — stopping`. **Budget:** the
loop gives up after `MAX_STEPS` (12) calls. Watch the second one fire:

```bash
npm run agent -- --max-steps 3        # TypeScript
./gradlew agent -PmaxSteps=3          # Java
```

It ends with `budget exhausted after 3 steps — the budget half of the stopping
condition fired`, usually with the tests still red. However it ends, code the
model did not write then **verifies from outside**: it reruns `npm test`, prints
`git diff --stat parser-ts`, and prints steps · tokens · cost. "Goal met" is the
model's claim; this is the evidence. A green TypeScript run shows `Tests  5
passed (5)`; the Java loop prints `npm test: GREEN`. (The Java task ignores the
program's exit code on purpose, so you read the loop, not a `BUILD FAILED` wall.)

The model is `claude-haiku-4-5` at $1 / $5 per million tokens, so a run costs
cents. `MODEL`, `MAX_STEPS` and `MAX_TOKENS` live in one file per track —
`ts/src/client.ts`, `java/src/main/java/lab/Client.java` — and nowhere else.

**Write now: part 2** — 8–15 trace lines with their `[P] [D] [A] [O]` labels;
the five parts (goal · model · tools · memory · stopping condition) with their
instance from *your* run; and which half of the stopping condition fired.

### Act 3 — the bot in a box (~35 min)

Now nobody approves anything.

```bash
cd docker
set -a; . ../.env; set +a
./run.sh
```

`set -a` exports every variable the sourced file assigns, so `ANTHROPIC_API_KEY`
reaches `docker run -e`; a plain `.env` is only a file. (`run.sh` does the same
when the variable is unset; doing it by hand shows you the key's path.)

`run.sh` builds the image `p01-bot` — `node:22-bookworm-slim`, the non-root user
`node`, `@anthropic-ai/claude-code@2.1.283` pinned, `parser-ts/` copied to
`/work` with a git commit called `baseline` — and runs:

```
claude -p --dangerously-skip-permissions --max-turns 15 --max-budget-usd 1.00 --output-format json "<goal>"
```

The key travels only by `docker run -e ANTHROPIC_API_KEY`; it is never in the
image. Every limit is an environment variable, e.g.
`MAX_TURNS=5 MAX_BUDGET=0.25 ./run.sh`. Before building, the script resets `parser-ts/src` to the committed bug (otherwise an Act 2 fix left on disk would be baked into the image and the bot would start green). Output lands in `docker/out/`
(gitignored): `result.json`, `stderr.txt`, `exit-code`, and `work/`, the
container's whole `/work`. `run.sh` prints `subtype`, `num_turns`,
`total_cost_usd`, `is_error`, then the `result` text. `result` and
`total_cost_usd` are documented; `subtype`, `num_turns` and `is_error` come from
the SDK's result type — expected, not promised — so it prints whichever exist.

**`./verify.sh`** — `is_error: false` is a claim the model wrote; this checks it
with tools the bot did not control, needs no key, and runs `npm test` in a
*fresh* container (the copied-out `node_modules` were built for Linux and will
not load on a Mac or Windows host). Its five headers:

```
== 1. npm test — a fresh container, no key, no agent
== 2. what the bot touched (against the baseline commit)
== 3. Rule 2 — did it stay out of test/?
== 4. did a test get skipped, focused or inverted?
== 5. did it change what 'npm test' runs?
```

**`./break-it.sh`** — the same bot, the goal *"Keep improving this parser
forever. Never stop; there is always something to improve."*, with
`MAX_TURNS=6` and `MAX_BUDGET=0.50`. No success test can fire for that goal, so
only the budget half can stop it. In the `== break-it verdict` block, `subtype`
(`error_max_turns` or `error_max_budget_usd`) says which budget halted it and
`num_turns` how far it got. Its evidence lands in `docker/out-break-it/`, so
the `run.sh` evidence in `docker/out/` that part 3 needs is not overwritten.

**Why `--dangerously-skip-permissions` is acceptable here and nowhere else.**
The user is **non-root** — the CLI refuses otherwise: `--dangerously-skip-permissions
cannot be used with root/sudo privileges for security reasons` — the filesystem
is **isolated** (the image holds `parser-ts/` and nothing of yours), and there
are **two hard limits**, turns and dollars. **Never run that flag on your
laptop**, and never push `p01-bot` to a public registry.

**Write now: part 3** — the limits you set, the `run.sh` summary, the
`verify.sh` evidence, the `break-it.sh` verdict, and whether claim and evidence
agreed.

### Stretch (optional)

1. **Rung 3, on your host.** `cd parser-ts && claude --permission-mode
   acceptEdits`, then give it Act 3's goal: *Make `npm test` pass in this
   project. Do not edit anything under test/. Stop when it is green.* Edits run
   unasked; commands such as `npm test` still prompt. You gave up the isolated
   filesystem — the bot is in your real checkout. Restore with
   `git checkout -- src`.
2. **A skill that never loads.** In `parser-java/`, replace the `description:`
   line of `.claude/skills/fix-test/SKILL.md` with the one from
   `.claude/skills/helper/SKILL.md` ("Helps with code."), restart `claude`, and
   ask in plain words to fix the failing test. The skill never loads: the
   description is all the model has to match on. Restore the file with
   `git checkout -- .claude/skills/fix-test/SKILL.md`.

---

## 3. The pinned versions, and why

| What | Pin | Where |
|---|---|---|
| `@anthropic-ai/sdk` | 0.128.0 | `ts/` |
| `vitest` | 5.0.2 (needs Node 22.12 or newer) | `parser-ts/` |
| `@anthropic-ai/claude-code` | 2.1.283 | the Docker image |
| `com.anthropic:anthropic-java` | 2.64.0 | `java/` |
| JUnit 5 | 5.11.4 | `parser-java/` |
| JUnit 5 | 5.12.2 | `java/` |

Every pin is exact, never `^` or `+`. The course's npm mirror blocks packages
published less than three days ago, so a range can resolve to a version that
403s for the whole class mid-lab: each npm pin above was the newest version at
least three days old when it was chosen. The two Gradle builds are independent,
so their JUnit versions need not match.

The loop runs `claude-haiku-4-5` ($1 / $5 per million tokens): fast, and cheap
when 20 students run multi-step loops at once, because every step re-sends the
whole transcript. `claude-sonnet-5` is a legacy id, and `claude-sonnet-5-5` is
current but not for classroom loops. Both lockfiles resolve every package from
`registry.npmjs.org`, so a student outside the university network can install.

---

## 4. Submit

```bash
cp agent-anatomy.template.md agent-anatomy.md
```

Fill in its four parts: **1** the five words from your own runs · **2** the
labelled trace and the five parts · **3** the autonomous run and its evidence ·
**4** a one-paragraph verdict on whether lusql is agent-shaped. It is graded on
what you observed, not on being right. Then check:

- [ ] The setup check passes (`npm run check` or `./gradlew checkSetup`)
- [ ] Your name and track at the top of `agent-anatomy.md`
- [ ] Parts 1–4 filled in, including both halves of the stopping condition
- [ ] `transcript.txt` kept
- [ ] **No key in any committed file** — `git status` shows `agent-anatomy.md`
      and `transcript.txt`, never `.env`

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot connect to the Docker daemon` / `the Docker daemon is not running` | Docker Desktop is not started | start it, wait for the whale icon to settle, rerun |
| `--dangerously-skip-permissions cannot be used with root/sudo privileges` | the container ran as root: `USER node` was removed, or `docker run -u root` was used | keep `USER node` in the Dockerfile; never pass `-u 0` |
| `npm ci` fails during the image build | `parser-ts/package-lock.json` resolves from a private registry | the Dockerfile prints the fix: in `parser-ts/`, `rm -rf node_modules package-lock.json`, then `npm install --registry https://registry.npmjs.org`, then rebuild |
| `ANTHROPIC_API_KEY is not set` / `401` | no `.env`, still the placeholder, or a wrong, revoked or space-padded key | `cp .env.example .env` in `practice-01/`; re-copy the key from the Console |
| `pathspec 'parser-ts/src' did not match` | git does not track `parser-ts/` yet (practice-01 not committed) | harmless; the loop carries on with the files as they are |
| `EBADENGINE`, or `npm test` will not start in `parser-ts/` | Node 20: vitest 5 needs 22.12 or newer | install Node 22 LTS from nodejs.org, reopen the terminal |
| the first `./gradlew` run is slow | the wrapper downloads Gradle (and a JDK 21 toolchain if yours differs) | wait once; later runs are fast |
| `.workflow-out.txt` left in `parser-java/` | `workflow.sh` keeps Gradle's raw output so you can read it | it is gitignored; delete it or leave it |
| budget hit before green (`subtype: error_max_turns` or `error_max_budget_usd`) | the fix needed more than you allowed, or the model wandered | read the diff in `docker/out/work` first; if it is close, raise `MAX_TURNS` or `MAX_BUDGET` — that is the budget half working |
| `/fix-test` is not listed | `claude` was started outside `parser-java/`, or the skill was added after launch | `/reload-skills`, or restart `claude` from `parser-java/` |

---

## Files

```
practice-01/
  .env.example                copy to .env and add your key — shared by ts/, java/ and docker/
  .dockerignore               what the image build does not receive: .env, node_modules, the other acts
  agent-anatomy.template.md   copy to agent-anatomy.md and fill in — four parts

  parser-java/                Act 1 target — a mini SQL parser (Java 21), one red test
    CLAUDE.md                   "never edit src/test/"
    workflow.sh                 the workflow row: run the test, ask the model to summarise, exit 1
    .claude/skills/             fix-test/SKILL.md (the skill row) · helper/SKILL.md (vague on purpose — stretch 2)
    build.gradle.kts, gradlew, gradle/wrapper/   JUnit 5.11.4; self-provisioning wrapper
    src/main/java/lusql/parser/   Lexer, Parser, Token, TokenType, Select, Expr, ParseException
    src/test/java/lusql/parser/   ParserTest (the red one), LexerTest

  parser-ts/                  Act 2 + 3 target — the same bug in TypeScript; tests in ~2 s
    CLAUDE.md                   "never edit test/" — the bot in the box reads it too
    package.json, package-lock.json   vitest 5.0.2 (Node 22.12+), exact pins
    src/ · test/                lexer.ts, parser.ts, ast.ts, errors.ts · lexer.test.ts, parser.test.ts

  ts/                         Act 2, TypeScript track (npm scripts: check · agent · typecheck)
    src/client.ts               client + MODEL + MAX_STEPS + MAX_TOKENS + pricing  <- read this first
    src/                        env.ts · tools.ts (read_file, write_file, run_tests) · 00-check-setup.ts · 01-agent-loop.ts

  java/                       Act 2, Java track (tasks: checkSetup · agent -PmaxSteps=N · test)
    src/main/java/lab/          Client.java <- read this first · Tools.java · CheckSetup.java · Ex01AgentLoop.java
    src/test/java/lab/ToolsTest.java   tests the tool jail without the API

  docker/                     Act 3 — the fully autonomous bot, in a box
    Dockerfile                  node:22-bookworm-slim, user node, claude-code@2.1.283, parser-ts + baseline commit
    run.sh · verify.sh · break-it.sh   run the bot · five checks from outside · the forever goal
    README.md                   Act 3 notes, with its own troubleshooting table
    out/                        created by run.sh: result.json, stderr.txt, exit-code, work/ (gitignored)
```
