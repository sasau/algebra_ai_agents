#!/usr/bin/env bash
# workflow.sh — the WORKFLOW row of Act 1.
#
# This is a workflow, not an agent, because YOUR code drew every arrow:
#
#     A) run the test  -->  B) if red, the model summarises the failure  -->  C) report, exit 1
#
# The path was fixed before anything ran. The model is ONE step on it: it receives the Gradle
# output on stdin and returns two lines of text. It cannot re-route (skip B, loop back to A),
# cannot pick a different test, and cannot edit a file — this script gives it no way to do any
# of that. Compare the AGENT row, where the model decides what runs next.
set -euo pipefail

cd "$(dirname "$0")"      # always run from parser-java/, wherever this was invoked from
OUT=.workflow-out.txt     # the raw Gradle output; gitignored, kept so you can read it afterwards

# ---- A) run the test ------------------------------------------- arrow drawn by: a human (you)
# `|| true` because a failing test makes gradlew exit 1, and under `set -e` that would end the
# script right here — before step B, which is the whole point.
./gradlew test --tests ParserTest > "$OUT" 2>&1 || true

# ---- B) if red, ask the model to summarise --------------------- arrow drawn by: a human (you)
# `-p` = one prompt, print the answer, exit. `--max-turns 1` = one model turn, so it cannot even
# call a tool. It reads the Gradle output from stdin and returns text. Nothing else can happen.
if grep -q "FAILED" "$OUT"; then
  SUMMARY="$(cat "$OUT" | claude -p --max-turns 1 --output-format text \
    "You are one step in a CI workflow. Summarise this Gradle test failure in two lines: what failed and the likely cause. Do not propose code.")"

  # ---- C) report and stop -------------------------------------- arrow drawn by: a human (you)
  echo "== workflow: ParserTest is RED =="
  echo "$SUMMARY"
  echo
  echo "(full Gradle output in $OUT — the fix is still yours to make)"
  exit 1
fi

echo "green"
exit 0
