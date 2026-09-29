# Step 2 — link a doc with an @import

**What you do:** add one line to `CLAUDE.md` that pulls in `slow-query.md` —
the Act 2 case — then measure what that one line costs.

**Why it matters:** `@path` inside `CLAUDE.md` inserts that file's full text
when the session starts. That gives you one place to maintain: edit
`slow-query.md` and every later session sees the new version, instead of a
stale copy pasted into `CLAUDE.md`. It is not free, though — an import loads
**in full, in every session**, whether that session needs it or not.

**The rules of `@`:**

- the path is relative to **the file that contains the `@`**, not to where you
  launched `claude`
- absolute paths and `~/…` work too
- an imported file can import others, up to **4 hops** deep
- inside `backticks` or a code block, `@` is ignored — so you can *write about*
  `@foo` without importing it
- a file outside the project asks for your approval once

**What to watch:** the **Memory files** entry in `/context`, before and after.
It should grow by roughly the size of `slow-query.md` — about 800 tokens.

> **Mention or import?** "The case is in slow-query.md" costs a dozen tokens,
> and Claude reads the file only if a task needs it. "@slow-query.md" costs the
> whole file, every session. Import what *every* session needs; mention
> everything else.

---

**Step 1 — run, and write down the Memory files number:**

/context

**Step 2 — add this line to the end of `CLAUDE.md`** (in your editor, or ask
Claude to add it exactly):

The Act 2 case, with its schema: @slow-query.md

**Step 3 — then `/exit`, start `claude` again, and run:**

/context

**Step 4 — then ask:**

How many rows does the messages table have?

Watch whether it calls `Read` at all. It should not need to — the number is
already in its context.

**Step 5 — now undo it.** Change that line to a plain mention:

The Act 2 case is in slow-query.md.

Every session does not need 800 tokens of SQL. Step 3 gives the SQL advice a
better home: a rule that loads only when SQL is on the table.
