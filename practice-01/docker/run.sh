#!/usr/bin/env bash
# run.sh — Act 3: the fully autonomous bot, in a box.
#
# This is the lecture's rung 4. In Acts 1 and 2 a human (you) sat in the loop: you approved
# edits, you watched each step. Here nobody does — Claude Code runs with
# --dangerously-skip-permissions, which the docs say to use ONLY "in isolated environments like
# containers, VMs, or dev containers ... where Claude Code cannot damage your host system".
# That is the one reason this script is legal: the bot never touches your machine. Three
# limits make the run safe, and each is a thing you can point at:
#
#   1. the CONTAINER  — a throwaway Linux box holding only parser-ts; your files are not in it
#   2. --max-turns    — at most N perceive/decide/act/observe cycles, then it stops
#   3. --max-budget-usd — at most $X of API spend, then it stops
#
# 2 and 3 are the BUDGET half of the stopping condition (Rule 3). The SUCCESS half is in the
# goal text: "stop when it is green". A goal with no success test — see break-it.sh — leaves
# the budget as the only thing that ever halts the loop.
#
#   ./run.sh                               defaults: 15 turns, $1.00, the fix-the-test goal
#   MAX_TURNS=5 MAX_BUDGET=0.25 ./run.sh   tighter
#   GOAL="..." ./run.sh                    a different goal (break-it.sh does this)
#
# Afterwards: ./verify.sh — the bot's own report in out/result.json is a CLAIM, not evidence.
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

case "$MAX_TURNS" in ''|*[!0-9]*) die "MAX_TURNS must be a whole number, got '$MAX_TURNS'" ;; esac
case "$MAX_BUDGET" in ''|*[!0-9.]*) die "MAX_BUDGET must be a dollar amount like 1.00, got '$MAX_BUDGET'" ;; esac

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

# --- 1. build the box -----------------------------------------------------------------------
# The context is practice-01/ (not docker/) because the Dockerfile copies parser-ts/ into
# the image. ../.dockerignore keeps your .env, node_modules and the other acts out of it.
# Every run rebuilds, so every run starts from the committed baseline — cached layers make
# a rebuild take about a second when nothing changed.
# --- 0. a clean target ----------------------------------------------------------------------
# The Dockerfile COPYs parser-ts/ from your working tree and commits it as the image's
# "baseline". If Act 2's loop left the bug already fixed on disk, the bot would start green and
# verify.sh would have nothing to show — so put the bug back first. Only parser-ts/src is
# touched; your own files elsewhere are not. (In a fresh clone before practice-01 is committed
# this prints a harmless "pathspec" warning and continues.)
echo "== 0. resetting parser-ts/src to the committed bug"
git -C "$PRACTICE_ROOT" checkout -- parser-ts/src 2>/dev/null \
  || echo "   (nothing to reset — parser-ts is not committed yet, or already clean)"

echo "== 1. building $IMAGE from $PRACTICE_ROOT"
docker build -f "$SCRIPT_DIR/Dockerfile" -t "$IMAGE" "$PRACTICE_ROOT"

# --- 2. a clean out/ ------------------------------------------------------------------------
# The run's report and a copy of the container's /work end up here. Wiped first, so what you
# read afterwards is from THIS run and not a mix of two.
case "$OUT" in */docker/out|*/docker/out-break-it) ;; *) die "refusing to rm -rf '$OUT' — unexpected path" ;; esac
rm -rf "$OUT"
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
# it — and with it the key in its environment — the moment the copy is done, or if you ^C.
CONTAINER=p01-bot-run
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true          # leftovers of an interrupted run
trap 'docker rm -f "$CONTAINER" >/dev/null 2>&1 || true' EXIT

echo "== 2. running: claude -p --dangerously-skip-permissions --max-turns $MAX_TURNS --max-budget-usd $MAX_BUDGET"
echo "   goal: $GOAL"
docker run --name "$CONTAINER" \
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
echo "Now run ./verify.sh — the bot's word is not evidence."
