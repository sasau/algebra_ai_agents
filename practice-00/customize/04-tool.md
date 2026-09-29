# Step 4 — turn a shell script into a tool

**What you do:** let Claude run `tools/git-summary.sh` without asking, then
tell it when to use it.

**Why it matters:** Claude Code can already run shell commands — that is its
`Bash` tool. So any script *you* can run, Claude can run: no server, no
protocol, no SDK. Two things turn a script into a *tool*:

1. **Permission** — an allow rule in `.claude/settings.json`, so it runs
   without a prompt every time.
2. **A pointer** — one line in `CLAUDE.md` (or a rule, or a skill) saying when
   to use it. Claude has no reason to go looking in `tools/`; if nothing
   mentions the script, it improvises with its own git commands.

**The script** is supplied — read it first. It is 20 lines, read-only, and
changes nothing:

| command | prints |
|---|---|
| `./tools/git-summary.sh` | branch, ahead/behind, changed files, last 5 commits |
| `./tools/git-summary.sh 10` | the same, with the last 10 commits |

**What to watch:** ask the same question before and after. Before: Claude
runs git commands of its own choosing. After: one call to the script, and no
permission prompt.

> **Pitfalls**
> - `permission denied` — the executable bit was lost in the clone or unzip:
>   `chmod +x tools/git-summary.sh`.
> - **Windows:** Claude Code runs Bash commands through Git Bash, so the
>   script works unchanged. Run it yourself from Git Bash too, not PowerShell.
> - The allow rule is matched **literally** up to the `*`.
>   `Bash(./tools/git-summary.sh *)` matches `./tools/git-summary.sh` and
>   `./tools/git-summary.sh 10`, but not `bash tools/git-summary.sh`.

---

**Step 1 — in your own terminal, run it yourself:**

```bash
./tools/git-summary.sh
```

**Step 2 — in `claude`, before changing anything, ask:**

What changed since my last commit?

Write down which commands it ran, and how many times it asked permission.

**Step 3 — create `.claude/settings.json`:**

```json
{
  "permissions": {
    "allow": ["Bash(./tools/git-summary.sh *)"],
    "deny": ["Read(./.env)"]
  }
}
```

The `deny` line is the Act 2 reference card's rule: Claude can never read
your key file, whatever anyone asks.

**Step 4 — add this line to the Commands section of `CLAUDE.md`:**

- Repo state (branch, changes, recent commits): run `./tools/git-summary.sh` — never guess.

**Step 5 — then `/exit`, start `claude` again, and ask the same question:**

What changed since my last commit?
