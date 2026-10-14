# Act 3 — unattended execution and independent verification

Follow the guided [practice README](../README.md#6-act-3--unattended-run-then-independent-verification).
Run from `practice-01/docker/` with Docker started and an API key in
`practice-01/.env` or your shell:

```bash
./run.sh
./verify.sh
./break-it.sh
OUT_NAME=out-break-it ./verify.sh
```

`run.sh` copies the supplied target into a fresh `.runs/act3-.../parser-ts`,
builds `p01-bot` and runs pinned Claude Code as a non-root user with no host
mounts. Defaults: 15 agentic turns/$1.00 estimated CLI budget; example override:
`MAX_TURNS=5 MAX_BUDGET=0.25 ./run.sh`. The runtime key and outbound network
remain available to the bot. The filesystem isolation, turn/spend caps and
resource limits reduce damage; they do not make the environment universally safe.

Reports are saved to `out/` and `out-break-it/`. A repeated run renames earlier
reports to `<name>.previous-<timestamp>-<pid>`. Inspect logs before sharing them:
secrets could appear if an agent prints them.

`verify.sh` trusts the freshly built image, not the extracted project's `.git`,
package scripts or dependencies. It compares file contents, refuses symlinks
and non-source changes, replaces only source in a clean image and runs the
original tests without a key or network. It exits nonzero on integrity/test
failure. `is_error` is CLI metadata. The `result` field may contain a model-backed
final response or a CLI/API error; use `subtype`/`terminal_reason`, stderr and the
saved exit status to classify it before attributing text to a model. Neither
metadata nor a completion claim proves tests passed. The clean image is part of the verifier's trust boundary: keep the
Dockerfile and baseline under instructor control.

`break-it.sh` gives an impossible-to-complete forever goal with 6 turns/$0.50.
Observe whether the model ends, a budget fires or execution fails. Do not assume
a specific stop field/value across Claude Code versions.
