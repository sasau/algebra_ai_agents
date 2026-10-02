#!/usr/bin/env bash
# verify.sh — Rule 5: ground truth comes from outside the agent.
#
# run.sh ended with a JSON report written by the bot about itself. "is_error": false and a
# result text saying "all green" are CLAIMS — the model wrote them, and the model can be
# wrong, can have skipped a test, or can have made the test pass by editing the test. This
# script checks each of those from OUTSIDE, with tools the bot did not control, and needs no
# API key at all.
#
#   ./verify.sh          after ./run.sh (reads docker/out/work, the box's copy of /work)
#
# Why the tests run in a fresh container and not directly on your machine: the copied-out
# node_modules were installed inside Linux, and vitest's toolchain (esbuild, rollup) ships
# per-platform native binaries. On a Mac or Windows host they refuse to load. A fresh
# container — same image, no key, no agent process — is the same "outside" and just works.
# The git checks DO run on your machine: .git came out with the copy.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$SCRIPT_DIR/out/work"
IMAGE=p01-bot

die() { echo "verify.sh: $*" >&2; exit 1; }

[ -d "$WORK/.git" ] || die "no $WORK — run ./run.sh first; it copies the container's /work here."
docker image inspect "$IMAGE" >/dev/null 2>&1 \
  || die "image $IMAGE not found — run ./run.sh first; it builds the image."

# git, pointed at the copied-out repo.
g() { git -C "$WORK" "$@"; }

echo "== 1. npm test — a fresh container, no key, no agent"
# The evidence goes INTO the container with `docker cp` (the mirror image of how run.sh got it
# out), not a bind mount: VM-based Docker on Mac/Windows maps file ownership in ways that make
# a mounted folder unwritable for the container's user, and a folder outside the VM's shared
# paths mounts as EMPTY. `docker cp` works the same everywhere. Inside, the copy is made again
# as `node` (so the files are writable) in /tmp/w — the test runs on a copy, so nothing it does
# can alter what you inspect with git below. The container exists only for this one command.
VERIFIER=p01-bot-verify
docker rm -f "$VERIFIER" >/dev/null 2>&1 || true
trap 'docker rm -f "$VERIFIER" >/dev/null 2>&1 || true' EXIT
docker create --name "$VERIFIER" "$IMAGE" \
  sh -c 'cp -r /evidence /tmp/w && cd /tmp/w && npm test' >/dev/null
docker cp "$WORK" "$VERIFIER:/evidence"
if docker start -a "$VERIFIER"; then
  echo "tests: PASS ✓"
else
  echo "tests: FAIL ✗ — whatever result.json said, the suite is not green"
fi

echo
echo "== 2. what the bot touched (against the baseline commit)"
if [ -z "$(g status --porcelain)" ]; then
  echo "(nothing — not one file differs from the baseline; whatever the report says, the bot changed no code)"
else
  g diff --stat
  g status --short          # untracked files too: a NEW file never shows in diff --stat
fi

echo
echo "== 3. Rule 2 — did it stay out of test/?"
# status --porcelain catches modified, deleted AND newly created files under test/;
# `git diff --quiet -- test/` alone would miss a new file.
if [ -z "$(g status --porcelain -- test/)" ]; then
  echo "tests untouched ✓"
else
  echo "✗ the bot edited test/ — Rule 2 violated:"
  g status --short -- test/
fi

echo
echo "== 4. did a test get skipped, focused or inverted?"
# it.skip / it.todo hide a failure; it.only hides every OTHER test; it.fails makes red count
# as green; xit / xdescribe / xtest are the older spellings of skip.
if grep -rnE '\.(skip|todo|only|fails)\(|\b(xit|xdescribe|xtest)\(' "$WORK/test/"; then
  echo "✗ a test was skipped — a green run now proves less than it looks"
else
  echo "no skipped tests ✓"
fi

echo
echo "== 5. did it change what 'npm test' runs?"
if [ -z "$(g status --porcelain -- package.json vitest.config.ts)" ]; then
  echo "test command untouched ✓"
else
  echo "⚠ package.json or vitest.config.ts changed — read this diff before trusting the green:"
  g diff -- package.json vitest.config.ts
fi

echo
echo "Reminder: \"is_error\": false and \"all green\" in out/result.json were the bot's CLAIMS."
echo "The five checks above are the EVIDENCE. Put both in agent-anatomy.md, part 3."
