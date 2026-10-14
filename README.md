# AI Agents & Automation — Practices

Lab code for the *AI Agents & Automation* course at Algebra University College.
One folder per practice session.

```
algebra_ai_agents/
  practice-00/    Intro to LLMs — first API call, context, knobs, JSON
  practice-01/    What are agents? — guided comparisons, supplied tools and agent loop, independently verified container run
  practice-02/    Tools and MCP — shared reader, bounded workspace server, Docker-backed ticket store
  practice-03/    Agent architectures — explicit loop, evidence-based retries, sequential delegation
  local-models/   Shared free local backend — Ollama tutorial, doctor, tool probe and practice tests
  ...
```

## Two tracks, same exercises

Practices 00 and 01 ship **two parallel implementations
of the same exercises** — a TypeScript track and a Java track — living side by
side in that practice's folder:

```
practice-00/
  ts/      TypeScript track   (npm, tsx)
  java/    Java track         (Gradle wrapper, JDK 21)
```

For Practice 00, pick **one** track and work it end to end. In Practice 01,
only Act 2 has a track choice: Act 1 uses the Java parser and Claude Code;
Act 3 uses the TypeScript parser in Docker. Follow [Practice 01 setup](practice-01/README.md)
for fresh working copies, an offline tool demo and the four-part report. They are deliberately the same
program written twice, so switching later costs you nothing — the exercises,
the model behaviour, and the lessons are identical either way.

Each practice folder is otherwise self-contained: its own dependency
manifests, its own scripts, its own `README.md`. You can work on one without
touching the others.

---

## Getting started

For a free local model backend, follow [local-models/README.md](local-models/README.md). It includes Ollama installation, model download/startup, a reusable loopback adapter, mock protocol tests and an actual inference probe. Run Practice 03 against that backend with `npm run verify:practice-03` from `local-models/`. Model probes and full architecture verification are reported separately.

```bash
git clone https://github.com/sasau/algebra_ai_agents
cd algebra_ai_agents/practice-00
cp .env.example .env        # then put your key in .env — see below
```

Then pick a track:

```bash
# TypeScript
cd ts && npm install && npm run check

# Java (no install step — the Gradle wrapper provisions itself)
cd java && ./gradlew checkSetup
```

Practice 02 is TypeScript only and needs Node 22.12+, Claude Code, and Docker/Compose. Its core lab needs no API key. Start with [practice-02/README.md](practice-02/README.md); complete four safe TODOs and submit independently checked findings.

Practice 03 is TypeScript only with three architecture TODOs. Its required offline checks need Node 22.12+ and no API key. Start with [practice-03/README.md](practice-03/README.md); [SETUP.md](practice-03/SETUP.md) covers startup and [LOCAL.md](practice-03/LOCAL.md) records actual Ollama inference separately from deterministic fixtures. Cloud integration is explicit and bounded.

Follow `practice-00/README.md` for the full walkthrough — prerequisites,
the three-act structure, the exercise table, and troubleshooting for both
tracks.

---

## The shared `.env`

For the API exercises in Practices 00 and 01, there is **one** key file per practice, at the practice's root (e.g.
`practice-00/.env`), read by *both* tracks — it is not duplicated into `ts/`
or `java/`. Copy it from the adjacent `.env.example` and put your real key in
it. An `ANTHROPIC_API_KEY` already exported in your shell takes precedence
over the file, so CI or a shared machine can override it without editing
anything.

---

## The one rule: never commit your API key

Your `ANTHROPIC_API_KEY` is a password. It goes in `.env`, which is listed in
`.gitignore` and must stay that way.

- `.env` — your real key, never committed
- `.env.example` — the *shape* of the file, with a placeholder, committed
- never a key pasted into a source file, a commit, a screenshot, or a chat message

If you ever commit a key by accident, **revoke it immediately** in the
Anthropic Console and issue a new one. Deleting the commit is not enough — it
stays in the git history and in anyone's clone.

---

## Requirements

Common to both tracks:

| Tool | Version | Check with |
|---|---|---|
| git | any recent | `git --version` |
| An Anthropic API key | — | the practice's `checkSetup`/`check` script |

Track-specific:

| Track | Needs | Check with |
|---|---|---|
| TypeScript | Node.js 20 LTS or newer | `node -v` |
| Java | JDK 21 — nothing else, the wrapper does the rest | `java -version` |

Practice 02 pins its own dependencies and PostgreSQL image. `npm run db:up` generates disposable local credentials in its ignored `.env.local`; do not commit that file.

Everything runs locally. Nothing in this repo deploys, tunnels, or publishes.
