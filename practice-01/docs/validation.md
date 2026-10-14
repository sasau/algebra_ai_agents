# Practice 01 verification — 14 October 2026

The installed repository passed **58 command checks**, including **22 unit tests**,
**12 scripted agent-loop scenarios**, **5 workflow scenarios** and **7 Docker verifier
scenarios**. No provider requests or paid inference were made. The parser source and
test baselines remain unchanged.

## Repeat without an API key

Use Node 22.12+, npm, JDK 21, Python 3 and Bash. Start from practice-01:

```bash
python3 scripts/verify-offline.py
```

This installs the pinned npm dependencies, runs both harness tracks, checks the
intentional parser failures, verifies source-only repair fixtures, exercises the
fixed workflow and checks each agent loop. Dependency downloads can use the
network. Model responses are supplied locally; no provider account is required.

For the container checks, start Docker and run:

```bash
python3 scripts/verify-offline.py --docker
```

This also builds p01-bot, checks the pinned Claude executable, tests the trusted
verifier and checks run.sh/break-it.sh orchestration with a test-only CLI in
containers with no network. Existing docker/out evidence is preserved and restored.
The separate test image is removed after the fixtures. A new ignored
.runs/verification-* directory holds every command log and results.json.

## Observed results

| Area | Result and meaning |
|---|---|
| Clean setup | npm ci succeeded in parser-ts and ts. Type checking succeeded in both npm projects. Both offline setup checks and both tool demos passed. |
| Unit tests | TypeScript tool policy: 4/4; Java tool policy: 11/11; evidence integrity: 7/7. |
| Intentional Java bug | Focused ParserTest: 1 passed, 1 failed. Full suite: 4 passed, 1 failed. The failure is unexpected token WHERE at 1:17. |
| Intentional TypeScript bug | 4 passed, 1 failed, with the same WHERE failure. A nonzero baseline exit is expected. |
| Source-only repair fixtures | The original tests passed after a minimal repair in disposable copies: 5/5 for Java and 5/5 for TypeScript. No original test was changed. |
| Agent loops | Each language passed six scripted scenarios: a small setup request, repair followed by independent verification, a false completion claim, exhaustion after three calls, a truncated response and an API failure. The success scenario also checked multiple tool requests in one turn, matching tool-result IDs, growing history and refused test/configuration/unknown-tool requests. |
| Workflow | Observed exits: red test plus successful summary = 1; failed summary = 2; missing key = 2; build failure = 2; green test = 0. The summary step used a local CLI stub. Test commands ran through the actual Gradle wrapper except the deliberately simulated build failure. Tool/MCP disabling flags and the one-turn limit were checked. |
| Docker image | Build passed. The installed Claude executable reported 2.1.283. A separate smoke check confirmed non-root execution, absent API key and required test tooling. |
| Docker verifier | Original red source failed; valid source-only repair passed; changed tests and package scripts were refused; deleted source failed; a symlink was refused. A valid source repair still passed when the extracted .git and node_modules were deliberately untrusted, because the verifier used the image's trusted files. |
| Container scripts | With a synthetic CLI, run.sh extracted result/stderr/exit/source artifacts, archived earlier evidence and preserved a goal containing quotes and shell syntax without executing that syntax. break-it.sh kept separate evidence and classified a scripted turn-limit result. Invalid turn, budget and output-name values were refused. These checks verify shell orchestration and reporting. |
| Missing credentials | Both live setup checks and both agent entry points failed clearly before inference. The unattended script's missing-key path also failed clearly in a separate fixture with no .env. |

## What the fixtures establish

The TypeScript scenarios use the real SDK against a server bound to 127.0.0.1,
with synthetic authentication markers. Assertions inspect the request history,
all tool-result IDs and refusal flags. The Java scenarios install a fake SDK
client only inside a separate test process; its production client is unchanged.
Both tracks execute the actual supplied tool dispatcher and parser tests.

The container-script fixture replaces only the CLI in a separate derived image.
Docker still runs the real shell scripts and extracts the artifacts. Its reported
turns, costs and completion text are scripted fixture values. They do not measure
real token usage, spending or model behavior.

## Skipped checks

A real provider round-trip, interactive /fix-test invocation, model-directed repair,
text-only model advice, real unattended repair and the real forever-goal experiment
were skipped because no API key was supplied. The checks above verify the local
programs and failure handling. Credentials, provider connectivity, model availability
and model ability remain unverified.

The host tool policy still permits modified source to run under the test process;
it is not an OS sandbox. A live Docker bot would still hold a key and outbound
network access. Passing tests establishes the supplied parser cases.

Machine-readable commands, exits, expected exits and fixture counts are in
[validation.json](https://github.com/sasau/algebra_ai_agents/blob/main/practice-01/docs/validation.json).
