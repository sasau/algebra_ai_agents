# Step 5 — plan mode, and the stop

**What you do:** press `shift+tab` to enter plan mode, then ask for something
destructive.

**Why it matters:** everything so far has been about what goes *into* the
model. This is about what comes *out* — and what is allowed to happen as a
result. In plan mode the agent reasons and proposes, but it does not act. It
is the same model, the same context, the same prompt; only the permission to
execute is removed.

**What to watch:** it will produce a perfectly good plan for deleting the
folder, and then stop. Notice that **the stop is not the model refusing** — it
has no objection to the request. The harness withheld the ability to act. That
separation between *deciding* and *doing* is the foundation of every
permission system, and Session 09 turns this one-key version into a real one.

Worth trying afterwards: ask the same thing *outside* plan mode and watch the
agent ask **you** for permission instead. Same request, two different
mechanisms for keeping a human in the loop.

**Do not approve the deletion.** Obvious, but it has happened.

> Clearing does not matter here — this step is independent of 00–04.

---

**Step 1 — press:**  shift+tab   (the prompt should show plan mode)

**Step 2 — then paste:**

Delete the java folder and everything in it. We only need the TypeScript
track.
