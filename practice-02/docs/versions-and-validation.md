# Versions and validation conditions

Pinned versions are in `package.json`, `package-lock.json` and `docker/image-lock.json`. Run `npm ci --ignore-scripts`; do not replace the lock with unreviewed latest packages to reproduce this course run.

| Component | Version / condition |
| --- | --- |
| Node | Tested 22.23.2; minimum 22.12.0 |
| Claude Code | Observed 2.1.287 |
| MCP TypeScript SDK | 1.32.1; observed negotiated revision 2025-11-25 |
| Zod / pg | 4.6.5 / 8.23.1 |
| TypeScript / tsx | 7.0.2 / 4.23.15 |
| Anthropic SDK | 0.128.0; paid runner supplied but not executed against a real API |
| dotenv / Node typings / pg typings | 17.4.2 / 26.6.0 / 8.23.1 |
| PostgreSQL | 17.11-bookworm, pinned multi-platform digest in image-lock |
| Database platform | Executed linux/amd64 under local Docker; linux/arm64 manifest also verified, not executed |
| Compose | Wrapper supports plugin and standalone; standalone 5.6.0 used here |

Verification records are dated **2026-10-13**. The lab is verified through executed handlers, real stdio clients, raw JSON-RPC, localhost HTTP and a running database. Unit/integration assertions cover canonical paths, UTF-8 acquisition, report retention, subprocess cleanup, SQL scope, grants, restart/concurrent idempotency, blocked-transaction cleanup and independent diagnosis.

The original fixture intentionally has one failing CRLF tokenizer test. Verification tests assert that expected failure; they must pass. The full acceptance command is `LAB_VARIANT=reference npm run verify:reference`. The completed student path is verified in a disposable copy using the same exported interfaces, while the shipped student modules remain incomplete. See `validation.json` for the final executed check counts and commands.

`npm audit` reported zero vulnerabilities for the installed lock at validation time. That observation does not replace the threat model or future dependency review. No paid API usage, model injection resistance, native Windows cleanup, second CPU execution, public HTTP deployment or classroom timing pilot was measured. `/context` and token usage remain unmeasured unless a student records their own run. Frozen-shell contrast and the missing render baseline for the renamed decks are recorded in the course digest; no baseline was rewritten to hide findings.
