# Step 2 — what it cost

**What you do:** run `/cost`, and reconcile it against what you just watched
happen.

**Why it matters:** the context window is not an abstraction — it is the
invoice. Every token in that window was paid for on the turn it was sent, and
**re-paid on every turn after it**. A file read once in turn 2 is still being
billed in turn 20.

**What to watch:**

- The total, obviously. It will be small — a few cents. That is not the point.
- **Multiply it.** Ask yourself what this session would have cost with a
  hundred source files instead of nine, or after two hours instead of ten
  minutes. The growth is not linear in the work you do; it is closer to
  quadratic in the length of the conversation, because each turn re-sends
  everything before it.
- Compare against take-home Exercise 2 (README §3), where you can watch the
  same multiplier appear in raw API calls with the numbers printed explicitly.

This is why "just use a bigger model with a bigger window" is not a strategy.
A bigger window raises the ceiling; it does not stop the growth.

> **Do NOT `/clear`.** Same session still.

---

/cost
