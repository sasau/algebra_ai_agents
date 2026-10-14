#!/usr/bin/env bash
set -euo pipefail
# Working directory: the course repository's local-models folder.
run_dir="evidence/curl-$(date -u +%Y%m%dT%H%M%SZ)-$$"
mkdir -p "$run_dir"
# --disable is first: ignore .curlrc. Bypass proxy environment configuration.
curl_args=(--disable --noproxy '*' --fail --silent --show-error --connect-timeout 5 --max-time 60)
curl "${curl_args[@]}" http://127.0.0.1:11434/api/version --output "$run_dir/version.json"
curl "${curl_args[@]}" http://127.0.0.1:11434/api/tags --output "$run_dir/tags.json"
curl "${curl_args[@]}" http://127.0.0.1:11434/api/show \
  -H 'Content-Type: application/json' --data-binary '{"model":"qwen3.5:9b"}' --output "$run_dir/show.json"
# Reject a hosted model alias before either inference request.
node --input-type=module -e 'import {readFileSync} from "node:fs"; const r=JSON.parse(readFileSync(process.argv[1])); if(r.remote_host||r.remote_model)process.exit(1)' "$run_dir/show.json"
curl "${curl_args[@]}" http://127.0.0.1:11434/api/chat \
  -H 'Content-Type: application/json' --data-binary @examples/chat.json --output "$run_dir/chat.json"
curl "${curl_args[@]}" http://127.0.0.1:11434/api/chat \
  -H 'Content-Type: application/json' --data-binary @examples/tool-request.json --output "$run_dir/tool.json"
node scripts/check-curl.mjs "$run_dir"
printf 'Saved evidence: %s\n' "$run_dir"
