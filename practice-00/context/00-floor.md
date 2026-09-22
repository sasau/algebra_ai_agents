# Step 0 — the floor

**What you do:** start `claude` and run `/context` before typing anything else.

**Why it matters:** the window is **not empty**. Before you have said a single
word, it already holds the system prompt and every tool definition the agent
can call. That is the floor — the tax you pay on every turn of every session,
forever.

**What to watch:** the number, and what it is made of. Most people guess the
floor is near zero and are wrong by an order of magnitude. Tool definitions in
particular are surprisingly expensive: each one is a name, a description and a
full JSON schema, and they are all re-sent on every request.

**You can only measure this once.** The moment you ask anything, the floor is
buried under conversation. Write the number down now.

> **Do NOT `/clear` after this** — steps 00 → 03 are one continuous session.
> You are growing a window on purpose. Clearing resets the measurement.

---

/context
