# Step 6 — change the system prompt, and see what it costs

**What you do:** launch Claude Code twice with a flag — once *adding* to its
system prompt, once *replacing* it — and measure both with `/context`.

**Why it matters:** everything so far — `CLAUDE.md`, imports, rules, skills —
sits *on top of* Claude Code's own system prompt. That prompt is the harness
talking to the model: how to use each tool, how to edit files safely, when to
stop and ask. You rarely need to change it. When you do, the two flags do very
different things:

| flag | what it does | use it for |
|---|---|---|
| `--append-system-prompt "…"` | adds your text to the end of the default | one rule for one launch, or a script run with `-p` |
| `--system-prompt "…"` | **replaces** the default entirely | an agent that is not a coding assistant — never a coding session |

Both have a `-file` twin (`--append-system-prompt-file`,
`--system-prompt-file`) that reads the text from a file. Replacing, in the
documentation's words, *"drops all of the default prompt, including tool
guidance and safety instructions."* The tools are still there; the
instructions for using them well are gone.

A gentler lever sits between `CLAUDE.md` and the flags: `/output-style`
switches how Claude responds (Default, Explanatory, Learning) by adjusting the
system prompt for you.

**What to watch:** the system-prompt line in `/context`, against your Act 2
floor.

> **Flags last one launch.** Nothing here is saved. `/exit` and a plain
> `claude` brings the default prompt back.

---

**Step 1 — `/exit`, then launch:**

```bash
claude --append-system-prompt "Always answer in Croatian."
```

**Step 2 — run `/context`, write down the system-prompt number, then ask:**

What does this project do?

**Step 3 — `/exit`, then launch:**

```bash
claude --system-prompt "You are a SQL reviewer. Answer in three short bullets."
```

**Step 4 — run `/context` again.** Compare the system-prompt number with step
2's, and with the floor you measured in Act 2.

**Step 5 — then ask, one after the other:**

Review the query in slow-query.md.

What changed since my last commit?

What does it do differently from the default Claude Code — and what did it
stop doing that you had not noticed it did?

**Step 6 — `/exit`, and start a plain `claude` again** before you do anything
else in this repo.
