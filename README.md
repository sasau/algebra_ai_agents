# AI Agents & Automation — Practices

Lab code for the *AI Agents & Automation* course at Algebra University College.
One folder per practice session.

```
practices/
  practice-00/    Intro to LLMs — first API call, context, knobs, JSON
  practice-01/    (next session)
  ...
```

Each practice folder is a **self-contained npm project**: its own
`package.json`, its own `npm install`, its own scripts. You can work on one
without touching the others.

---

## Getting started

```bash
git clone <this-repo>
cd practices/practice-00
npm install
cp .env.example .env        # then put your key in .env
npm run check               # verifies your environment end-to-end
```

Then follow that folder's `README.md`.

---

## The one rule: never commit your API key

Your `ANTHROPIC_API_KEY` is a password. It goes in `.env`, which is listed in
`.gitignore` and must stay that way.

- ✅ `.env` — your real key, never committed
- ✅ `.env.example` — the *shape* of the file, with a placeholder, committed
- ❌ a key pasted into a `.ts` file, a commit, a screenshot, or a chat message

If you ever commit a key by accident, **revoke it immediately** in the Anthropic
Console and issue a new one. Deleting the commit is not enough — it stays in the
git history and in anyone's clone.

---

## Requirements

| Tool | Version | Check with |
|---|---|---|
| Node.js | 20 LTS or newer | `node -v` |
| npm | ships with Node | `npm -v` |
| An Anthropic API key | — | `npm run check` |

Everything runs locally. Nothing in this repo deploys, tunnels, or publishes.
