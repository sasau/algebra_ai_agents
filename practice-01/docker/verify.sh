#!/usr/bin/env bash
# Run the trusted image's tests/dependencies/config against only the bot's source.
# No API key, network, host mount, or bot-controlled .git is used by the verifier.
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUT_NAME="${OUT_NAME:-out}"
case "$OUT_NAME" in out|out-break-it) ;; *) echo 'OUT_NAME must be out or out-break-it' >&2; exit 2 ;; esac
WORK="$SCRIPT_DIR/$OUT_NAME/work"
IMAGE=p01-bot
[ -d "$WORK/src" ] || { echo "No $WORK/src — run ./run.sh first" >&2; exit 1; }
VERIFIER="p01-bot-verify-$$"
BASELINE="$(mktemp -d "${TMPDIR:-/tmp}/p01-baseline.XXXXXX")"
cleanup() { docker rm -f "$VERIFIER" >/dev/null 2>&1 || true; rm -rf "$BASELINE"; }
trap cleanup EXIT
docker create --name "$VERIFIER" --network none --cpus 1 --memory 512m --pids-limit 128 \
  --cap-drop ALL --security-opt no-new-privileges "$IMAGE" \
  sh -c 'rm -rf /work/src && cp -r /evidence-src /work/src && timeout 120 npm test' >/dev/null
docker cp "$VERIFIER:/work/." "$BASELINE/"
echo '== 1. npm test — fresh container, trusted tests/config/dependencies, no key or network'
node "$SCRIPT_DIR/check-evidence.mjs" "$BASELINE" "$WORK"
# The helper has checked types and restricted every changed file to src/*.ts.
# Replace src so deleted files stay deleted; leave trusted tests and tooling intact.
docker cp "$WORK/src/." "$VERIFIER:/evidence-src"
if docker start -a "$VERIFIER"; then
  echo 'VERIFIED: PASS — trusted tests passed with source changes only'
else
  echo 'VERIFIED: FAIL — trusted tests did not pass' >&2
  exit 1
fi
