# practice-01/docker/Dockerfile — the box the fully autonomous bot runs in (Act 3).
#
# The lecture's rung 4 — "the agent decides AND acts, nobody approves each step" — is only
# acceptable because of where it happens. This image is a throwaway Linux machine that
# contains the parser project and the Claude Code CLI, and NOTHING of yours: no home
# directory, no SSH keys, no other repos. Whatever the bot does, it does in here.
#
# Build it from practice-01/ (the context must contain parser-ts/, which this file copies):
#
#   docker build -f docker/Dockerfile -t p01-bot .
#
# run.sh does that for you, then starts the container with the three limits that make an
# unattended run safe: the container boundary, --max-turns, --max-budget-usd.
#
# The API key is NOT in this file and must never be. It arrives at run time only, through
# `docker run -e ANTHROPIC_API_KEY`, and lives for exactly as long as the container does.
# Anyone who can pull an image can read every ENV and every layer in it — a key baked in
# here would be a key published.

# The npm package @anthropic-ai/claude-code declares `engines.node >= 22` (since 2.1.198),
# so we use Node 22. Anthropic's own reference Dockerfile uses node:20 + `USER node`; we
# keep the USER node part and follow the newer Node requirement. "slim" because the bot
# needs node, npm and git — not the 1 GB of compilers in the full image.
FROM node:22-bookworm-slim

# git: the baseline commit below, and the bot itself will want `git diff` to see its own work.
# ca-certificates: TLS to api.anthropic.com. Nothing else — every extra tool in the box is
# one more thing an unattended agent can do.
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Claude Code, PINNED to one exact version. Two reasons, and both matter:
#  - Reproducibility: every student's bot behaves the same; a floating `latest` would not.
#  - The lab network's npm mirror refuses packages published less than 3 days ago (403).
#    2.1.283 shipped 2026-09-25; 2.1.284–2.1.286 (28–30 Sept) were still inside that window
#    when this was written. Bump the pin deliberately, never with `@latest`.
# DISABLE_AUTOUPDATER keeps the pin honest: the CLI would otherwise try to replace itself
# at start-up, which both defeats the pin and fails (node's global dir is root-owned).
RUN npm install -g @anthropic-ai/claude-code@2.1.283 --no-audit --no-fund
ENV DISABLE_AUTOUPDATER=1

# /work is where the project goes; /out is where the run writes its report and a copy of
# /work for run.sh to `docker cp` out afterwards. WORKDIR would create /work owned by root;
# the `node` user must own both because `npm ci`, the bot and the copy all write there.
RUN mkdir -p /work /out && chown node:node /work /out

# Non-root is REQUIRED, not a nicety. The CLI refuses the bypass flag as root, verbatim:
#   "--dangerously-skip-permissions cannot be used with root/sudo privileges for security reasons"
# The node image ships a ready-made unprivileged user `node` (uid 1000) — we use it.
USER node
ENV HOME=/home/node
WORKDIR /work

# The target: parser-ts, the same WHERE-clause bug you fixed by hand in Act 2. Copied as
# `node` so the bot can edit it. .dockerignore (in practice-01/) decides what comes along —
# node_modules and .env do not; parser-ts/CLAUDE.md does, because the bot must read the
# "never edit test/" rule the same way you would.
COPY --chown=node:node parser-ts/ /work/

# Guard: the lockfile must point at the public registry. npm writes the registry it was
# generated against into every `resolved` URL, so a lockfile made on a machine that uses a
# private mirror carries that mirror's hostname — and this container (and every student's
# laptop) has no account there, so `npm ci` dies with a wall of "HTTP 403 Forbidden" that
# names the wrong problem. Catch it here with the right message instead.
RUN if grep '"resolved": "https://' package-lock.json | grep -qv '"resolved": "https://registry.npmjs.org/'; then \
      echo >&2 ""; \
      echo >&2 "parser-ts/package-lock.json resolves packages from a private registry:"; \
      grep -o '"resolved": "https://[^/]*' package-lock.json | sort -u | sed 's/"resolved": "//' >&2; \
      echo >&2 "Students have no access to it. Fix, on your machine, inside parser-ts/:"; \
      echo >&2 "  rm -rf node_modules package-lock.json"; \
      echo >&2 "  npm install --registry https://registry.npmjs.org"; \
      echo >&2 "then commit the new lockfile and rebuild."; \
      exit 1; \
    fi

# `npm ci`, not `npm install`: ci installs exactly what package-lock.json says and FAILS if
# the lockfile is missing or out of date. That is what we want — a bot run must start from
# the same dependency tree every time, or a difference in behaviour could be the deps, not
# the agent. If this step fails with "npm ci can only install with an existing
# package-lock.json", run `npm install` once inside parser-ts/ on your machine and commit the
# lockfile; do not weaken this line.
RUN npm ci --no-audit --no-fund

# Baseline commit — so that after the run `git diff` shows EXACTLY what the bot changed,
# and verify.sh can prove whether test/ was touched. A fresh repo, a throwaway identity.
# node_modules goes into .git/info/exclude (not a .gitignore in the tree) so the baseline
# stays small without adding a file the bot could then see as "its" change.
RUN git init -q \
 && echo node_modules >> .git/info/exclude \
 && git -c user.email=bot@lab -c user.name=bot add -A \
 && git -c user.email=bot@lab -c user.name=bot commit -qm baseline

# No ENTRYPOINT on purpose: run.sh passes the full `claude -p ...` command so every flag is
# visible in the script you read, not hidden in the image. `docker run --rm p01-bot claude
# --version` is the smoke test.
