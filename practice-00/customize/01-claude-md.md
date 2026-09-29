# Step 1 — turn CLAUDE.md into a briefing

**What you do:** replace the three house rules you wrote in Act 2 with a
proper briefing — what this repo is, how to check it, the rules that hold
every time — and keep it short.

**Why it matters:** `CLAUDE.md` is what every session starts from. Claude Code
sends it right after its own system prompt, as the first message of the
conversation, so it does the job of a system prompt that *you* own. It stays in
the context window for the whole session: every line you add is paid for on
every request.

**What goes in, and what stays out:**

| in | out |
|---|---|
| commands to build, run and check | secrets, keys, anything from `.env` |
| conventions that differ from the default | long documents — link them instead (step 2) |
| hard constraints ("model ids live in one file") | anything that changes every week |
| pointers to where things are | anything Claude can learn by reading the code |

Keep it under **200 lines** — that is the official guidance. This one should
be about 15.

**What to watch:** `/context` lists every instruction file the session loaded,
under **Memory files**. Yours should be there, together with anything from your
home folder and — on a managed machine — your organisation's policy file.
(`/memory` is the editor: it lists where the files *can* live and opens them.)

> **`/init` writes a first draft for you.** It reads the repo and proposes a
> `CLAUDE.md` (or improvements to the one you have). Treat it as a draft: it
> tends to describe what the code already says. Cut every line Claude could
> have found by reading a file.

---

**Step 1 — run:**

/init

**Step 2 — then paste this:**

Trim CLAUDE.md to at most 15 lines. Keep: one sentence on what this repo is,
the setup-check command for each track, and these rules — cite the exact file
path when you mention code; model ids live only in ts/src/client.ts and
java/src/main/java/lab/Client.java; never read, print or edit .env. Drop
anything I could learn by reading the code.

**Step 3 — then `/exit`, start `claude` again, and run:**

/context

**Step 4 — then ask:**

Where would I change the model this lab uses?

The answer should name **both** files by path. Nobody repeated the rule to it —
it came from the briefing.
