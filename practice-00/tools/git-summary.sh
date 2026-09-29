#!/usr/bin/env bash
# git-summary.sh — a read-only snapshot of this repo, one call instead of three.
# Act 3 turns it into a tool Claude can call. It never changes anything.
#
#   ./tools/git-summary.sh        branch, changes, last 5 commits
#   ./tools/git-summary.sh 10     ... last 10 commits
set -euo pipefail

n="${1:-5}"
case "$n" in
  ''|*[!0-9]*) echo "usage: $0 [N]   (N = how many commits, a whole number)" >&2; exit 2 ;;
esac

git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
  || { echo "git-summary: not inside a git repository" >&2; exit 1; }

echo "== branch and changes"
git status --short --branch        # line 1: branch...upstream [ahead/behind]
echo "== last $n commits"
git log --oneline -n "$n"
