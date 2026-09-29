# Step 3 — rules: split by topic, load by path

**What you do:** create two rule files — one that always loads, and one that
loads only when Claude reads the SQL case.

**Why it matters:** `CLAUDE.md` is always on. A file in `.claude/rules/` is
either always on too (no frontmatter), or — with a `paths:` list — loaded only
when Claude reads a file that matches. Git rules matter in every session; SQL
review rules matter only when there is SQL to review. Put each one where it
costs tokens only when it earns them.

**Where rules live:**

| folder | applies to |
|---|---|
| `.claude/rules/*.md` | this project, shared through git — subfolders are fine |
| `~/.claude/rules/*.md` | every project on your machine; loads before the project's |

The only frontmatter key a rule understands is `paths:` — a list of glob
patterns, relative to the project.

**What to watch:** right after launch, the **Memory files** list in `/context`
shows `git.md` but not `sql.md`. Ask about the SQL case, run `/context` again,
and `sql.md` has appeared — it loaded the moment Claude read a matching file.

---

**Step 1 — create `.claude/rules/git.md`:**

```md
# Git
- Commit subjects: imperative mood, at most 72 characters, no trailing period.
- Never stage or commit .env.
- Never run git push unless I ask for it in this turn.
```

**Step 2 — create `.claude/rules/sql.md`:**

```md
---
paths:
  - "**/*.sql"
  - "slow-query.md"
---
# SQL review
- Assume PostgreSQL 16.
- For every fix, name the index it needs — or say that it needs none.
- Flag any function wrapped around a column in WHERE: it stops an index on
  that column from being used.
```

**Step 3 — then `/exit`, start `claude` again, and run:**

/context

**Step 4 — then paste:**

Review the query in slow-query.md. Give me three fixes, ranked.

**Step 5 — then run:**

/context

Did `sql.md` load? Does the answer follow its three lines — PostgreSQL 16, an
index named for each fix, the functions in `WHERE` flagged?
