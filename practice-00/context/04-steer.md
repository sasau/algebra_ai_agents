# Step 4 — steer it without changing the question

**What you do:** write a `CLAUDE.md`, clear the window, then ask step 03's
question again — **word for word identical**.

**Why it matters:** this is the whole point of the context lab. You are about
to change an agent's behaviour without changing anything you say to it. The
question is a constant; the *standing instructions* are the variable.

`CLAUDE.md` is read at the start of every session and sits in the same layer
as `system` in a raw API call — the layer for rules that hold for every turn,
as opposed to material specific to one question. You met that distinction on
lecture slide 21; this is it in your hands.

## ⚠ The one clear in this lab

**Order matters, and this is the only place you clear:**

1. Write `CLAUDE.md` (prompt below).
2. **`/clear`** — this is the moment.
3. Re-ask the exact question from `03-ask.md`.

Clear *before* writing the file and the agent never sees your rules take
effect from a clean start. Skip the clear entirely and you cannot tell whether
the new answer came from `CLAUDE.md` or from the conversation you have been
building for the last fifteen minutes. **Both mistakes produce a plausible
result and a worthless measurement.**

**What to watch:** diff the two answers. Did it adopt the tone? Does it cite
file paths now? Did it get shorter or longer? Then ask the harder question —
did anything you wrote get *ignored*? A rule that does not take is as
interesting as one that does, and Session 12 is about why.

---

**Step 1 — paste this:**

Create a CLAUDE.md in the practice-00 directory with these house rules:
- Always cite the exact file path when you mention code.
- Be terse. Prefer three short sentences over a paragraph.
- When asked what something does, lead with why it exists, not how it works.

**Step 2 — then run:**

/clear

**Step 3 — then paste the original question, unchanged:**

What does this project do?
