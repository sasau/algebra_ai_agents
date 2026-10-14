#!/usr/bin/env bash
# Unattended Claude Code run in a disposable container. No host bind mounts.
# The runtime key and outbound network are accessible to the bot. Turn limits
# and the CLI's estimated spending cap bound execution; they are not an exact
# billing guarantee or a complete security boundary. Verify source independently.
# Earlier outputs are renamed, never erased. No source checkout/reset occurs.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRACTICE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
# Where this run's evidence lands. break-it.sh sets OUT_NAME=out-break-it so its run never
# overwrites the evidence of the run you are about to write up in part 3.
OUT="$SCRIPT_DIR/${OUT_NAME:-out}"
IMAGE=p01-bot

die() { echo "run.sh: $*" >&2; exit 1; }

# --- the knobs — every one overridable from the environment --------------------------------
MAX_TURNS="${MAX_TURNS:-15}"
MAX_BUDGET="${MAX_BUDGET:-1.00}"
GOAL="${GOAL:-Make \`npm test\` pass in this project. Do not edit anything under test/. Stop when it is green.}"

case "$MAX_TURNS" in ''|0|*[!0-9]*) die "MAX_TURNS must be a whole number, got '$MAX_TURNS'" ;; esac
node -e 'if (!/^\d+(\.\d+)?$/.test(process.argv[1]) || Number(process.argv[1]) <= 0) process.exit(1)' "$MAX_BUDGET" \
  || die "MAX_BUDGET must be a positive dollar amount, like 1.00"
case "${OUT_NAME:-out}" in out|out-break-it) ;; *) die "OUT_NAME must be out or out-break-it" ;; esac

# --- the key: from your shell, or from practice-01/.env — never from this file or the image --
# `set -a` exports every variable the sourced file assigns, so ANTHROPIC_API_KEY reaches
# `docker run -e` below. A key already in your shell wins; .env is only read when it is unset.
if [ -z "${ANTHROPIC_API_KEY:-}" ] && [ -f "$PRACTICE_ROOT/.env" ]; then
  set -a
  # shellcheck source=/dev/null
  . "$PRACTICE_ROOT/.env"
  set +a
fi
if [ -z "${ANTHROPIC_API_KEY:-}" ] || [ "$ANTHROPIC_API_KEY" = "sk-ant-REPLACE-ME" ]; then
  die "ANTHROPIC_API_KEY is not set.
  Fix: cd $PRACTICE_ROOT && cp .env.example .env, then put your key in .env
  (from https://console.anthropic.com/settings/keys). This script reads it from there."
fi

# --- Docker ---------------------------------------------------------------------------------
command -v docker >/dev/null 2>&1 \
  || die "docker is not installed. Fix: install Docker Desktop (Mac/Windows) or docker-ce (Linux)."
docker info >/dev/null 2>&1 \
  || die "the Docker daemon is not running. Fix: start Docker Desktop and wait for the whale to settle."

# Build only a fresh target copy. Never git checkout or reset student files.
TARGET="$(node "$PRACTICE_ROOT/scripts/prepare-run.mjs" act3)"
echo "== 1. building $IMAGE from fresh baseline copy $TARGET"
docker build -f "$SCRIPT_DIR/Dockerfile" -t "$IMAGE" "$(dirname "$TARGET")"

# --- 2. preserve earlier out/ ------------------------------------------------------------------------
# The run's report and a copy of the container's /work end up here. Archived first, so what you
# read afterwards is from THIS run and not a mix of two.
case "$OUT" in */docker/out|*/docker/out-break-it) ;; *) die "refusing to use output directory '$OUT' — unexpected path" ;; esac
if [ -e "$OUT" ]; then mv "$OUT" "$OUT.previous-$(date +%Y%m%d-%H%M%S)-$$"; fi
mkdir -p "$OUT"

# --- 3. run the bot -------------------------------------------------------------------------
# Quoting, deliberately: the goal and the limits go INTO the container as environment
# variables (-e), and the command string is single-quoted on the host so nothing in it expands
# here. Inside the box, /bin/sh expands "$GOAL", "$MAX_TURNS", "$MAX_BUDGET" exactly once,
# as whole words — a goal containing quotes or backticks (ours has backticks) cannot break the
# command or run as code. The alternative, splicing $GOAL into the string here, is the classic
# shell-injection shape; do not "simplify" it back.
#
# -e ANTHROPIC_API_KEY with no value copies the variable from this shell without ever writing
# it into a file, a layer or this script's output. stdout is the JSON report; stderr is kept
# separately so a crash message cannot corrupt the JSON. The exit code is saved because
# --max-turns "exits with an error when the limit is reached" — that non-zero IS information,
# so we keep it and go on.
#
# Results leave the box with `docker cp`, not a bind mount (-v "$OUT:/out"). A bind mount
# looks simpler but is not portable: with VM-based Docker on Mac/Windows (Docker Desktop,
# Colima, OrbStack) a directory the container creates inside the mounted folder comes out
# owned by YOU with mode 755, and the container's uid 1000 then cannot write a second file
# into it — `cp -r /work /out/work` dies with "Permission denied" (seen while writing this).
# On native Linux it works but leaves out/ owned by uid 1000, so the next wipe needs sudo.
# `docker cp` has neither problem: the files land owned by you, everywhere.
# The price: the container must still exist after the command (so no --rm). The trap deletes
# it after extraction. Review logs before sharing: printed secrets could persist in artifacts.
CONTAINER="p01-bot-run-$$"
# Unique name avoids deleting another student run.          # leftovers of an interrupted run
trap 'docker rm -f "$CONTAINER" >/dev/null 2>&1 || true' EXIT

echo "== 2. running: claude -p --dangerously-skip-permissions --max-turns $MAX_TURNS --max-budget-usd $MAX_BUDGET"
echo "   goal: $GOAL"
docker run --name "$CONTAINER" --cpus 1 --memory 768m --pids-limit 128 \
  --cap-drop ALL --security-opt no-new-privileges \
  -e ANTHROPIC_API_KEY \
  -e GOAL="$GOAL" \
  -e MAX_TURNS="$MAX_TURNS" \
  -e MAX_BUDGET="$MAX_BUDGET" \
  "$IMAGE" sh -c '
    claude -p --dangerously-skip-permissions \
      --max-turns "$MAX_TURNS" --max-budget-usd "$MAX_BUDGET" \
      --output-format json "$GOAL" > /out/result.json 2> /out/stderr.txt
    echo $? > /out/exit-code
    cp -r /work /out/work
  '
docker cp "$CONTAINER:/out/." "$OUT/"

# --- 4. what the bot says happened -----------------------------------------------------------
# Read with node, not jq, so there is nothing extra to install. Defensive on purpose: the
# CLI documents `result`, `session_id` and `total_cost_usd`; `subtype`, `num_turns`,
# `is_error` and `duration_ms` come from the SDK result type and are expected but not
# promised (2.1.283 does emit all of them, plus `terminal_reason`). We print whichever exist
# and list every top-level key so you can see for yourself.
echo
node -e '
  const fs = require("fs");
  const [, resultPath, exitPath, errPath] = process.argv;
  const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "");
  const raw = read(resultPath);
  const exit = read(exitPath).trim() || "?";
  let r;
  try { r = JSON.parse(raw); } catch (e) {
    console.log("== claude exited " + exit + " and out/result.json is not JSON.");
    console.log(raw ? "stdout was:\n" + raw.slice(0, 600) : "stdout was empty.");
    const err = read(errPath);
    if (err) console.log("stderr (out/stderr.txt) ends with:\n" + err.slice(-1500));
    process.exit(0);
  }
  if (Array.isArray(r)) r = r.find((x) => x && x.type === "result") || r[r.length - 1];
  console.log("== 3. what the bot reported (claude exit code " + exit + ")");
  for (const k of ["subtype", "terminal_reason", "num_turns", "total_cost_usd", "is_error", "duration_ms"]) {
    if (k in r) console.log("   " + k.padEnd(16) + JSON.stringify(r[k]));
  }
  console.log("   top-level keys: " + Object.keys(r).join(", "));
  console.log("== 4. the result text");
  console.log(typeof r.result === "string" ? r.result : JSON.stringify(r.result, null, 2));
' "$OUT/result.json" "$OUT/exit-code" "$OUT/stderr.txt"

echo
echo "Full report: $OUT/result.json · the box's /work: $OUT/work"
echo "Now run ./verify.sh — CLI metadata and model text both need independent verification."
