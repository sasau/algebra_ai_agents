# Act 3 — the fully autonomous bot, in a box

The lecture's rung 4: Claude Code runs with `--dangerously-skip-permissions` — no human approves any
step. The docs allow that mode only "in isolated environments like containers, VMs, or dev containers
… where Claude Code cannot damage your host system". So the bot runs inside a throwaway Docker
container that holds `parser-ts/` and nothing of yours, and three limits bound it: the **container**,
`--max-turns`, `--max-budget-usd`. Act 3 takes about 35 minutes.

| Script | What it does | Needs the key? |
|---|---|---|
| `run.sh` | builds the image, runs the bot on *"Make `npm test` pass… Stop when it is green"*, prints the bot's JSON report | yes |
| `verify.sh` | Rule 5 — checks the bot's claims from **outside**: `npm test` in a fresh container, `git diff`, was `test/` touched, was a test skipped | no |
| `break-it.sh` | Rule 3 — same bot, goal *"keep improving this parser forever"*, 6 turns / $0.50; prints which half of the stopping condition halted it | yes |

```bash
cd algebra_ai_agents/practice-01          # the key is read from practice-01/.env (cp .env.example .env)
./docker/run.sh                           # 15 turns, $1.00 — a 6-line fix lands well inside that
./docker/verify.sh                        # the evidence
./docker/break-it.sh                      # the demonstration; then ./docker/verify.sh again if you like
MAX_TURNS=5 MAX_BUDGET=0.25 ./docker/run.sh   # every knob is an environment variable
```

Everything `run.sh` produces lands in `docker/out/` (gitignored), and `break-it.sh` writes to `docker/out-break-it/` so the two runs' evidence never overwrite each other: `result.json` (the bot's report),
`stderr.txt`, `exit-code`, and `work/` — the container's whole `/work`, with a `.git` whose single
`baseline` commit is the project as shipped, so `git diff` is exactly what the bot changed.

## What goes into `agent-anatomy.md`, part 3

- The limits you set (`MAX_TURNS`, `MAX_BUDGET`) and the goal text.
- From `run.sh`'s report: `num_turns`, `total_cost_usd`, `is_error` (and `subtype` if printed).
- From `verify.sh`: tests PASS/FAIL, the `git diff --stat` lines, "tests untouched" or not, "no skipped tests" or not.
- From `break-it.sh`: `subtype` and `num_turns` — which budget fired, and why no success test ever could.
- The ONE rule of the five you saw matter most, in a sentence, with the line of output that showed it.

## Two warnings

1. **Never run `--dangerously-skip-permissions` on your host.** The flag is legal here only because
   the box is disposable and contains nothing of yours. The same command in your home directory is
   an agent with your permissions and no brake.
2. **Never push `p01-bot` to a public registry.** It contains the project; the key is **not** in it —
   it arrives at `docker run -e` and dies with the container — and it must stay that way. No `ENV`
   with a key, no `COPY .env`, ever. (Course rule: nothing is published, tunnelled or hosted publicly.)

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `the Docker daemon is not running` / `Cannot connect to the Docker daemon` | Docker Desktop is not started | start it, wait for the whale icon to settle, rerun |
| `403` from the npm mirror on `@anthropic-ai/claude-code@2.1.283` during build | you are on the lab network and the pin is under 3 days old (mirror rule) — or the mirror dropped it | check the date on `npm view @anthropic-ai/claude-code time`; pin the newest version ≥3 days old, in the Dockerfile only |
| `--dangerously-skip-permissions cannot be used with root/sudo privileges` | the container ran as root — `USER node` was removed or overridden (`docker run -u root`) | keep `USER node` in the Dockerfile; never pass `-u 0` |
| `npm ci can only install with an existing package-lock.json` | `parser-ts/package-lock.json` is missing | `cd parser-ts && npm install` once, commit the lockfile; do not change `npm ci` to `npm install` |
| build stops at `package-lock.json resolves packages from a private registry` | the lockfile was generated behind a company npm mirror; its URLs point there | do what the message says: regenerate it in `parser-ts/` with `--registry https://registry.npmjs.org` |
| budget hit before green (`subtype: error_max_turns` / `error_max_budget_usd`, tests still red) | the fix needed more turns than you allowed, or the model wandered | read `out/work`'s diff first — is it close? Then rerun with `MAX_TURNS=25`; that is Rule 3 working, not failing |
| `verify.sh` says tests PASS but "the bot edited test/" | the model made the test pass by changing the test | that is the lesson of Rule 2 — write it down; `git checkout -- test/` inside `out/work` and rerun `npm test` to see the truth |
| `ANTHROPIC_API_KEY is not set` | no `practice-01/.env`, or it still says `sk-ant-REPLACE-ME` | `cp .env.example .env` in `practice-01/`, paste your key |
| `result` says `SELF_SIGNED_CERT_IN_CHAIN`, `total_cost_usd: 0` | a TLS-inspecting proxy (campus / corporate network) sits between the box and the API | run from another network, or follow the link in the message (`NODE_EXTRA_CA_CERTS`) |
