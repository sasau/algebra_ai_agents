# Step 5 — a skill: a procedure loaded only when needed

**What you do:** write a `/commit-message` skill that drafts a commit message
from the repo's real state.

**Why it matters:** a skill is a Markdown file holding the instructions for
one job. Only its short `description` sits in the context all the time; the
body loads when the skill runs — because you typed `/commit-message`, or
because Claude decided your request matches the description. Twenty skills
cost twenty descriptions, not twenty procedures. Compare `CLAUDE.md`: always
loaded, in full.

**Where skills live:**

| folder | applies to |
|---|---|
| `.claude/skills/<name>/SKILL.md` | this project, shared through git |
| `~/.claude/skills/<name>/SKILL.md` | you, in every project — beats a project skill of the same name |

Keep `name` equal to the folder name; it becomes the command,
`commit-message` → `/commit-message`.

**Anatomy of the file below:**

- **frontmatter** — `name`; `description`, which is what Claude matches your
  request against; `allowed-tools`, what the skill may run without asking,
  *only while it runs*
- **`` !`command` ``** at the start of a line — runs *before* Claude sees the
  skill, and its output replaces the line, so the skill arrives already
  holding live data
- **`$ARGUMENTS`** — whatever you typed after the command name

> **Pitfall — the skill aborts before it starts.** An `` !`…` `` command never
> asks for permission. If it is not already allowed, the skill fails with
> `Shell command permission check failed`. The `allowed-tools` line below is
> what prevents that.

> **New folder?** Claude Code notices edits in skills folders that existed when
> it started. If `.claude/skills/` is new, run `/reload-skills` (or restart).

---

**Step 1 — create `.claude/skills/commit-message/SKILL.md`:**

```md
---
name: commit-message
description: Draft a commit message for the uncommitted changes in this repo. Use when the user asks for a commit message or wants their changes described.
allowed-tools: Bash(./tools/git-summary.sh *) Bash(git diff *)
argument-hint: "[what to emphasise]"
---

## The repo right now
!`./tools/git-summary.sh 5`

## Your job
Draft ONE commit message for the changes above.
1. Subject: imperative mood, at most 72 characters, no trailing period.
2. A blank line, then 1–3 bullets saying why — not what.
3. Match the style of the recent commits shown above.
4. If the user added a hint, honour it: $ARGUMENTS
5. Print the message only. Never run git commit.
```

**Step 2 — then run:**

/reload-skills

and then `/skills` — is `commit-message` listed?

**Step 3 — make a small change** (write something in `findings.md`), then run:

/commit-message

**Step 4 — then with an argument:**

/commit-message mention the Act 3 findings

**Step 5 — `/clear`, then ask in plain words:**

Draft a commit message for what I changed.

Did Claude pick the skill by itself? If it did not, your description is too
vague — rewrite it and try again.
