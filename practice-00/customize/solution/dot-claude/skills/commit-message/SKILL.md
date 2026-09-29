---
name: commit-message
description: Draft a commit message for the uncommitted changes in this repo. Use when the user asks for a commit message or wants their changes described.
allowed-tools: Bash(./tools/git-summary.sh *) Bash(git diff *)
argument-hint: "[what to emphasise]"
---

## The repo right now
!`./tools/git-summary.sh 5`

## Your job
Draft ONE commit message for the changes above.
1. Subject: imperative mood, at most 72 characters, no trailing period.
2. A blank line, then 1–3 bullets saying why — not what.
3. Match the style of the recent commits shown above.
4. If the user added a hint, honour it: $ARGUMENTS
5. Print the message only. Never run git commit.
