# AI Agents & Automation — Practices

Lab code for the *AI Agents & Automation* course at Algebra University College.
One folder per practice session.

```
algebra_ai_agents/
  practice-00/    Intro to LLMs — first API call, context, knobs, JSON
  practice-01/    What are agents? — five words hands-on, a hand-written agent loop, an autonomous bot in a box
  practice-02/    (next session)
  ...
```

## Two tracks, same exercises

Starting with `practice-00`, each practice ships **two parallel implementations
of the same exercises** — a TypeScript track and a Java track — living side by
side in that practice's folder:

```
practice-00/
  ts/      TypeScript track   (npm, tsx)
  java/    Java track         (Gradle wrapper, JDK 21)
```

Pick **one** track and work it end to end. They are deliberately the same
program written twice, so switching later costs you nothing — the exercises,
the model behaviour, and the lessons are identical either way.

Each practice folder is otherwise self-contained: its own dependency
manifests, its own scripts, its own `README.md`. You can work on one without
touching the others.

---

## Getting started

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

Follow `practice-00/README.md` for the full walkthrough — prerequisites,
the three-act structure, the exercise table, and troubleshooting for both
tracks.

---

## The shared `.env`

There is **one** key file per practice, at the practice's root (e.g.
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

Everything runs locally. Nothing in this repo deploys, tunnels, or publishes.
