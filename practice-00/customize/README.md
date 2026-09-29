# Act 3 · make the agent yours — the six steps

In Act 2 you steered an agent someone else had set up. Now you set it up
yourself: the files Claude Code reads before you type anything, a tool it can
call, a skill it loads when needed, and the system prompt underneath all of
them.

| file | what you build | where it lives | what it shows |
|---|---|---|---|
| `01-claude-md.md` | a real briefing | `CLAUDE.md` | what every session starts from |
| `02-imports.md` | link a doc with `@` | `CLAUDE.md` | an import loads in full, every session |
| `03-rules.md` | one always-on rule, one path-scoped | `.claude/rules/` | rules that load only when relevant |
| `04-tool.md` | allow `tools/git-summary.sh` | `.claude/settings.json` + `CLAUDE.md` | any script becomes a tool |
| `05-skill.md` | a `/commit-message` skill | `.claude/skills/commit-message/` | a procedure loaded only on demand |
| `06-system-prompt.md` | append, then replace | two launch flags | what the default prompt does for you |

## How to run it

```bash
cd algebra_ai_agents/practice-00
claude
```

**Launch from `practice-00/`, every time.** `CLAUDE.md`, `.claude/` and
`./tools/` are all found relative to the folder you start `claude` in.

**Restart between steps** — `/exit`, then `claude`. This is the opposite of the
context lab's rule, for a different reason: the files you write here are read
when a session *starts*, so a fresh session is the only honest test that they
work.

## The load order, broadest first

| file | scope | shared? |
|---|---|---|
| managed policy (`/Library/Application Support/ClaudeCode/CLAUDE.md` on macOS) | the whole organisation | set by IT |
| `~/.claude/CLAUDE.md` | you, in every project | no |
| `CLAUDE.md` (or `.claude/CLAUDE.md`) | this project | yes — commit it |
| `CLAUDE.local.md` | you, in this project | no — git ignores it |

All of them load, in that order; none replaces another. When two disagree,
Claude may follow either one — so fix the contradiction instead of relying on
the order.

## Stuck? The reference solution

`solution/` holds the finished files, **deliberately renamed** so Claude Code
does not load them:

| in `solution/` | copy to |
|---|---|
| `CLAUDE.example.md` | `CLAUDE.md` |
| `dot-claude/` | `.claude/` |

```bash
cp customize/solution/CLAUDE.example.md CLAUDE.md
mkdir -p .claude && cp -R customize/solution/dot-claude/. .claude/
```

The renaming is the lesson in miniature: none of these files does anything
because of what is *in* it until it has the exact name, in the exact place,
that Claude Code looks for.

## What you are actually learning

1. **`CLAUDE.md` does the job of a system prompt without being one.** Claude
   Code sends it right after its own system prompt, as the first message of
   the conversation. You own it; the harness owns the system prompt.
2. **Everything here is a plain file.** A tool is a script plus a permission
   plus one line telling Claude when to use it. A skill is a Markdown file.
   Sessions 02 and 05 build tools the heavyweight way (tool-use API, MCP);
   Session 12 goes deep on skills.
3. **Every file you add costs tokens on every turn, or only when needed.**
   `CLAUDE.md`, imports and plain rules are always on; path-scoped rules and
   skill bodies load on demand. Choosing between them is context management
   (Session 11) in miniature.

Record everything in `findings.md`, in the Act 3 section.
