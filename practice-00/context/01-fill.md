# Step 1 — fill it on purpose

**What you do:** make the agent read the whole source tree, then measure again.

**Why it matters:** this is the single fastest way to fill a context window,
and it is the one people do without noticing. Nine TypeScript files is a
*small* project. Watch what nine small files cost.

**What to watch:** run `/context` again straight afterwards and compare against
your floor from step 00. Three things to note:

- **How much it grew** — in tokens, and as a multiple of the floor.
- **Which part grew.** The file contents are now permanently in your history.
  They are not a cache you can drop; every future turn re-sends them.
- **That you never typed any of it.** The expensive part of a context window is
  almost always material the agent pulled in, not what you wrote.

This is the dangerous growth: it is invisible, it is fast, and it does not
shrink by itself. When the window fills, the agent must compact — and
compaction loses detail silently. Session 08 (memory on disk) and Session 11
(context management) are the answers to exactly this problem.

> **Do NOT `/clear`.** Same session as step 00.

---

Read every .ts file under ts/src and summarise what each one does in a single
sentence. Then tell me which file I should read first to understand the
project.

(Java track: read every .java file under java/src/main/java/lab instead.)
