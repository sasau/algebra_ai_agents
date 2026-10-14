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

# A fixed workflow: local test -> if red, one text-only API request -> report.
# --bare skips hooks/plugins/project instructions. --tools '' disables built-ins;
# strict empty MCP configuration disables external tools too. A turn limit alone
# would NOT prevent a tool call. The API key must be exported in your shell.
status=0
./gradlew test --tests ParserTest --rerun-tasks > "$OUT" 2>&1 || status=$?
if [ "$status" -eq 0 ]; then
  echo "== workflow: ParserTest is GREEN =="
  exit 0
fi
if ! grep -q 'ParserTest > .* FAILED' "$OUT"; then
  echo "== workflow: setup/build error, not an observed test failure =="
  echo "Read $PWD/$OUT; fix the environment before asking a model."
  exit 2
fi
if [ -z "${ANTHROPIC_API_KEY:-}" ] || [ "$ANTHROPIC_API_KEY" = "sk-ant-REPLACE-ME" ]; then
  echo "ANTHROPIC_API_KEY must be exported; see practice-01 README (workflow setup)." >&2
  exit 2
fi
echo "== workflow: ParserTest is RED =="
if claude -p --bare --tools '' --strict-mcp-config --mcp-config '{"mcpServers":{}}' \
  --max-turns 1 --max-budget-usd 0.05 --output-format text \
  "You are one step in a CI workflow. Summarise this Gradle test failure in two lines: what failed and the likely cause. Do not propose code." < "$OUT"; then
  : # The requested summary returned successfully; preserve the planned red status below.
else
  echo "workflow.sh: model summary step failed; inspect authentication/network/CLI error above" >&2
  exit 2
fi
echo "Full Gradle output: $PWD/$OUT — the workflow reports; it does not fix."
exit 1
