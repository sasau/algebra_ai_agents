# Practice 01 — What are agents?

Use a small parser bug to see who chooses the next action. You will compare a
command, reusable instructions, a fixed workflow, text-only advice and a coding
agent. Then you will inspect a supplied agent loop and verify an unattended run.
This practice applies Lecture 1's agent loop, five components and human gates.

**You do not write a SQL engine today.** The supplied parser reads a tiny subset
of SQL. `SELECT * FROM t` works. `SELECT * FROM t WHERE x = 1` fails because the
parser expects the statement to end immediately after the table name. Existing
tests describe the behavior to add. Do not change those tests.

| Act | Your task | Output |
|---|---|---|
| 1, about 30 min | Compare five ways of approaching the same Java test; identify an agentic interaction inside the agent run | Six observations, plus a saved transcript |
| 2, about 30 min | Inspect and run the supplied tools and agent loop in TypeScript **or** Java; repeat with a smaller step limit | A labelled trace and independent test result |
| 3, about 35 min | Run Claude Code in a disposable container and verify its source changes with trusted tests | CLI report, verifier verdict and observed stopping reason |

Submit `agent-anatomy.md`, completed from the four-part template. Keep
`transcript.txt` as evidence. The 120-minute route allocates setup 15 min, Act 1 30 min, Act 2 30 min, Act 3 35 min and submission 10 min.

## 1. Get the repository and identify the folders

Install **Node.js 22.12 or newer**, npm, **JDK 21**, git and
[Claude Code](https://code.claude.com/docs/en/setup). Act 3 also needs Docker
Desktop or Docker Engine. Both Act 2 tracks need Node: both test a TypeScript
parser. You choose the language of the **agent harness**, not the target parser.

```bash
git clone https://github.com/sasau/algebra_ai_agents.git
cd algebra_ai_agents/practice-01
export P01_ROOT="$PWD"
cp agent-anatomy.template.md agent-anatomy.md
node --version
java -version
claude --version
```

`P01_ROOT` means the absolute path to this practice in this terminal. Keep the terminal
open; later commands use it to avoid guessing how many `..` levels to climb.

```text
practice-01/
  parser-java/   supplied Java parser, tests, CLAUDE.md and fix-test skill: Act 1
  parser-ts/     supplied TypeScript parser and tests: Acts 2 and 3
  ts/            supplied TypeScript agent harness: one Act 2 choice
  java/          supplied Java agent harness: the other Act 2 choice
  scripts/       prepare-run.mjs creates fresh exercise copies
  docker/        unattended run and independent verification: Act 3
  .runs/         generated working copies; ignored by git, never submitted
```

The supplied `parser-java/` and `parser-ts/` remain the starting examples. Each
exercise creates a new directory in `.runs/`. Previous runs and your source edits
are preserved. **There is no automatic `git checkout` or reset.** A fresh copy
starts from the supplied folder's current contents, so leave the two supplied
parser folders unchanged and work in the printed run directory.

## 2. Install and check the offline parts

Install target dependencies first, from the practice root:

```bash
cd "$P01_ROOT/parser-ts"
npm ci
npm test
```

Expected: **1 failed, 4 passed (5)**, including
`ParseException: unexpected token WHERE at 1:17`. Exit status 1 is expected for
this baseline test. An install error, missing executable or startup error is a
setup failure, not the planned bug.

Choose **one** harness track. These checks do not call a model or need a key:

```bash
# TypeScript track
cd "$P01_ROOT/ts"
npm ci
npm run check
npm run typecheck
npm test
npm run tools:demo
```

```bash
# Java track
cd "$P01_ROOT/java"
./gradlew checkSetup
./gradlew test
./gradlew toolsDemo
```

The Java wrapper downloads Gradle/dependencies on the first run. Install JDK 21
before running it; the build requests that toolchain and does not configure an
automatic JDK downloader. Java command failures propagate as a failed Gradle
task; read the program's message just above Gradle's final error summary.

Both tool demos print a new `Run directory: .../.runs/tools-.../parser-ts`, then:

```text
read_file(src/parser.ts): OK
write_file(test/parser.test.ts): REFUSED (expected)
write_file(package.json): REFUSED (expected)
... exit code 1 ... unexpected token WHERE ...
DEMO PASSED — tools work; the supplied WHERE test is intentionally red. No model was called.
```

The TypeScript spelling is `exit code: 1`; Java prints `exit code 1`. The demo
exits **0** when it reads the source, refuses both protected writes and observes
the expected red parser test. This is different from the target's `npm test`,
which exits 1 because the parser has the planned bug.

## 3. Set up model access separately

Claude Code on your host uses its own login. Start `claude` and follow its login
instructions, then exit. The supplied SDK loop, the text-only workflow and
the container use an **Anthropic API key**, billed separately from a subscription.

```bash
cd "$P01_ROOT"
cp .env.example .env
```

Open `.env` in your editor and replace `sk-ant-REPLACE-ME` with your key from
[Anthropic Console](https://console.anthropic.com/settings/keys). Keep the key
out of source, transcripts, screenshots and submissions. `.env` is ignored by
git. The two SDK tracks read this shared file; an already exported shell value
wins. To explicitly make one small paid API check, run **your chosen track**:

```bash
cd "$P01_ROOT/ts"
npm run check:live
```

```bash
cd "$P01_ROOT/java"
./gradlew checkSetup -Plive
```

Default setup checks stay offline. A successful offline check does not prove
that your key, account balance, selected model or network works. A live check
asks for only a short response and reports credential/network failures.

## 4. Act 1 — compare who chooses the next action

Create your first disposable Java parser copy:

```bash
cd "$P01_ROOT"
ACT1_DIR="$(node "$P01_ROOT/scripts/prepare-run.mjs" act1)"
printf '%s\n' "$ACT1_DIR"
cd "$ACT1_DIR"
./gradlew test --tests ParserTest --rerun-tasks
```

Expected: `parsesSelectStar() PASSED`, `parsesWhereClause() FAILED`,
`unexpected token WHERE at 1:17`, and `2 tests completed, 1 failed`.

For each new comparison below, **exit the previous Claude session**, create a
fresh copy with the same `ACT1_DIR=...` command, and `cd "$ACT1_DIR"`. Keep its
printed path in your notes. Do not reset files underneath a running session.

1. **Tool: run the test command above.** You chose the command. It executes a
   defined operation, reports a failure and exits. It does not decide how to fix it.
2. **Skill: inspect and invoke supplied instructions.** Open
   `$ACT1_DIR/.claude/skills/fix-test/SKILL.md`. The folder is already included;
   no MCP server or registration command is needed. From `$ACT1_DIR`, run
   `claude --permission-mode default`, then enter `/fix-test ParserTest`.
   Claude Code discovers the project skill and uses its instructions with its
   built-in Read/Edit/Bash tools. Reads may run without prompting; approve only
   appropriate edits/commands and refuse test changes. Explicit `/fix-test`
   invocation selects the skill directly; it does not test automatic selection
   from the skill description. Inspect the source diff and rerun the test.
3. **Workflow: run a fixed program.** In a fresh copy, export the key without
   printing it, then run the script:

   ```bash
   set -a
   . "$P01_ROOT/.env"
   set +a
   ./workflow.sh
   ```

   Read `workflow.sh` first. It runs `ParserTest`; if red, it asks one model
   request to summarize the failure and reports it. It does not repair source.
   `--bare` skips hooks/plugins/project context, `--tools ''` disables built-in
   tools, and a strict empty MCP configuration disables external tools. One turn
   and $0.05 cap the model step. Exit 1 means the observed test is red; exit 2
   means setup/auth/build did not permit that comparison. Raw test output is
   saved in this copy's `.workflow-out.txt`.
4. **Text-only advice: restrict the available capabilities.** In a fresh copy,
   supply the failure and source as text to an API-authenticated Claude Code
   request with no tools. Export the key as in the workflow step, then run:

   ```bash
   ./gradlew test --tests ParserTest > failure.txt 2>&1
   cat > chat-task.txt <<'PROMPT'
   Explain the supplied failure and show a minimal source diff.
   Preserve the tests. Explain how the diff handles WHERE.
   PROMPT
   cat failure.txt src/main/java/lusql/parser/{Parser,Select,Expr}.java \
     chat-task.txt | claude -p --bare --tools "" \
     --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
     --max-turns 1 --max-budget-usd 0.10 > chat-answer.txt
   cat chat-answer.txt
   ```

   Apply the proposed source fix yourself and rerun the focused test. The flags
   enforce text-only operation; a natural-language request alone would not.
   Save the answer, your edit and the independent verdict. The dollar limit is
   the CLI's estimate, not an exact billing ceiling.
5. **Agent: give a goal.** In a fresh copy, start Claude Code in default
   permission mode and enter:
   `Make ./gradlew test --tests ParserTest pass. Do not edit src/test/. Stop when it is green.`
   Observe what it chooses to read, change and run. Review approvals; refuse
   test edits. Verify with the test command yourself. Save a few relevant
   transcript lines in `$P01_ROOT/transcript.txt` without keys or other private data.

Your **sixth observation** comes from comparison 5: locate the first tool
request. That is an agentic interaction because the model requested an action
from its harness. A permission prompt may appear later; tool request and prompt
are different events. Fill Part 1 of `agent-anatomy.md` now.

## 5. Act 2 — inspect the tools, then the loop

Use your chosen track. The tool functions and loop are supplied: your task is to
understand, execute and annotate them, not reconstruct an SDK application from
an unexplained blank file.

| Question | TypeScript | Java |
|---|---|---|
| What tools are advertised to the model? | `ts/src/tools.ts`: `TOOLS` | `java/src/main/java/lab/Tools.java`: `definitions()` |
| Which function actually executes a request? | `runTool(name, input)` | `dispatch(name, input)` |
| Where is a request sent to the API? | `ts/src/01-agent-loop.ts`: `client.messages.create` | `Ex01AgentLoop.java`: `messages().create` |
| Where are model and limits? | `ts/src/client.ts` | `Client.java` |
| How does history grow? | `messages.push(...)` | `messages.add(...)` |

The tools are plain functions in **your program**. The loop sends their JSON
schemas in the API request, receives `tool_use`, dispatches the request locally,
and sends a matching `tool_result`. You do not install these tools in Claude
Code and do not configure MCP in this practice.

Run your chosen track after the live setup check:

```bash
cd "$P01_ROOT/ts"
npm run agent
```

```bash
cd "$P01_ROOT/java"
./gradlew agent
```

Each run prints its own `.runs/act2-.../parser-ts` path. Source, tests and
dependencies are copied for the run; the baseline and earlier evidence remain.
The visible labels are **[P] input** (goal/history), **[D] model response**,
**[A] dispatched tool request** and **[O] tool result**. Visible text is not a
transcript of private model reasoning.

Read `src/parser.ts` in the printed run path to inspect the result. The harness
reruns tests after the model ends, errors or uses its budget, and prints the
source difference from the baseline. `end_turn` says the model ended a turn;
it does not prove success. The outside test decides whether the goal is green.
A failed check or exhausted budget produces a nonzero program/task exit.

Repeat with **one controlled change**: reduce only the model-call budget.

```bash
# TypeScript; from ts/
npm run agent -- --max-steps 3
```

```bash
# Java; from java/
./gradlew agent -PmaxSteps=3
```

Compare the two run paths and traces. If the model ends before step 3, record
that observation; a small budget is a limit, not a promise that it will fire.
Defaults are 12 model calls and 2,048 output tokens per call. SDK requests time
out after 60 seconds without retries; a test command has a 120-second timeout.
The printed cost uses a local price estimate; confirm actual charges in your
provider account. Fill Part 2 of your report.

### What the tool boundary protects

`read_file` accepts TypeScript source/tests and specified project metadata;
it does not expose `.env`, `.git` or `node_modules`. It returns at most 20 KB.
`write_file` accepts only `.ts` files under `src/`, up to 64 KB. Tests, package
scripts, dependency locks and test configuration are read-only. Invalid types,
extra fields, path traversal, absolute paths and symlink paths are refused.
`run_tests` runs a fixed command, caps captured output and clears the API key
from that child process's environment.

**This is a tool policy, not an operating-system sandbox.** TypeScript source
executed by the test runner still runs on your host and can access files or the
network using your account. Use a lab VM/container for untrusted code; do not
point this exercise at private repositories. Act 3 introduces an isolated
filesystem and a separate verifier, but its running bot still holds an API key
and outbound network access.

## 6. Act 3 — unattended run, then independent verification

Start Docker and confirm `docker info` shows server details. From the practice:

```bash
cd "$P01_ROOT/docker"
./run.sh
./verify.sh
./break-it.sh
```

`run.sh` reads the shared `.env` if the key is not already exported. It creates a
fresh Act 3 baseline copy and builds `p01-bot` from **only that parser target**.
It runs pinned Claude Code as the non-root `node` user with no host mounts,
15 turns, a $1.00 estimated CLI spending limit, bounded CPU/memory/processes and dropped Linux capabilities.
The spending limit uses the CLI’s estimate, may overshoot within a call and can differ from the final provider bill. A Claude Code agentic turn is not identical to one SDK model call. Change limits explicitly with `MAX_TURNS=5 MAX_BUDGET=0.25 ./run.sh`.

The bypass-permissions flag appears only inside this dedicated container.
The runtime API key and outbound network remain accessible to that agent.
A container reduces host damage; it does not make credential exfiltration,
harmful generated source or leaked logs impossible. Inspect artifacts before
sharing them. Never use this bypass flag on your host for the exercise.

Evidence is in `docker/out/`: `result.json`, `stderr.txt`, `exit-code`, and
`work/`. Before another run, the old directory is renamed to
`out.previous-<timestamp>-<pid>`. `break-it.sh` uses `out-break-it/` and preserves
its earlier directories too. Neither command erases earlier evidence.

The JSON fields `is_error`, `subtype`, `num_turns` and `total_cost_usd` are CLI
metadata. The `result` field can contain a model-backed final response or a
CLI/API error. Classify it using `is_error`, `subtype` or `terminal_reason`,
`stderr.txt` and `exit-code` before attributing text to a model. A completion
claim still needs independent verification. Neither report category verifies parser
correctness. **`verify.sh`** compares extracted evidence with a fresh copy of
the trusted image, refuses changes outside `src/*.ts` and all symlinks, then runs
only the bot's source with **trusted tests, configuration and dependencies** in
a fresh container. It uses no key, no network and no host mounts. The bot's
`.git`, `node_modules`, package scripts and changed tests are never executed.
Any integrity or test failure makes verification exit nonzero.

`break-it.sh` uses a goal to improve forever, capped at 6 turns/$0.50. A finite
run cannot finish that goal, but the model may end early or encounter an error.
Record the **actual** stop reason. To verify its separate evidence, use
`OUT_NAME=out-break-it ./verify.sh`. Fill Part 3, then the Part 4 lusql verdict.

## 7. Submit and troubleshoot

Submit all four report parts and the short transcript. Refer to specific output
lines and run paths. Explain a failed run accurately rather than claiming it
worked. Do not submit `.env`, `node_modules`, `.runs` or container output trees.

| Symptom | Next action |
|---|---|
| `/fix-test` is missing | Exit Claude; start it inside the printed Act 1 `parser-java` directory; confirm `.claude/skills/fix-test/SKILL.md` exists |
| `EBADENGINE` or Vite fails before tests start | Install Node 22.12+; reopen terminal; rerun `npm ci` in the affected npm project |
| Java toolchain not found | Install JDK 21 and set `JAVA_HOME` to that installation; wrapper does not download it |
| `401`, `429`, insufficient credit or proxy TLS error | Check the live setup result; fix the key/account/network before a paid loop; never disable TLS validation |
| Tool demo exits 1 | Read the full output: planned WHERE failure is required, but dependency/startup failures do not count |
| Docker daemon unavailable | Start Docker Desktop/Engine; wait until `docker info` shows the server |
| Parser baseline already green | You edited the supplied folder; preserve those edits, then obtain a fresh clone in a separate directory |
| Verifier fails despite `is_error: false` | Read its integrity/test verdict; CLI completion is not proof of the goal |

Exact dependency versions and lockfiles are supplied. Use `npm ci`; do not
upgrade dependencies during the lab. Model availability, prices and Claude Code
CLI behavior can change; consult official documentation when a pinned version
is unavailable.

## 8. Verify the companion code without an API key

To check the repository itself, use Python 3 with the normal Node/JDK/Bash
prerequisites. These checks install dependencies and exercise both tracks with
controlled local responses. They preserve the supplied bug and tests and create
new ignored verification reports.

```bash
cd "$P01_ROOT"
python3 scripts/verify-offline.py
# Include image build, trusted verifier and container-script fixtures:
python3 scripts/verify-offline.py --docker
```

The default command needs no Docker daemon or provider credentials. The Docker
option needs a running daemon. These are regression checks; complete the lab's
model experiments when model access is available. Scripted responses verify tool
handling and stopping logic; real model behavior remains a separate check.
See the detailed
[verification report](https://github.com/sasau/algebra_ai_agents/blob/main/practice-01/docs/validation.md).
