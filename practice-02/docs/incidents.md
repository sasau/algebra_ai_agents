# Historical mechanisms and their classroom reconstructions

These primary sources motivate the boundaries. The selected demonstrations are synthetic reconstructions; they do not assert that the pinned SDK or PostgreSQL image contains these historical flaws. Consult the original advisories for affected/fixed release ranges rather than treating a lab reconstruction as an exploit against a current package.

| Source | Mechanism | Lab connection |
| --- | --- | --- |
| [CVE-2025-53110 / GHSA-hc55-p739-j48w](https://github.com/modelcontextprotocol/servers/security/advisories/GHSA-hc55-p739-j48w) | Filesystem access restrictions bypassed through colliding path prefixes. | E03 compares `startsWith(root)` with a separator-aware decision. |
| [CVE-2025-53109 / GHSA-q66q-fx2p-7w4m](https://github.com/modelcontextprotocol/servers/security/advisories/GHSA-q66q-fx2p-7w4m) | Filesystem access bypass through symlink handling. | E03 checks canonical targets as well as lexical paths. |
| [CVE-2025-6514 / GHSA-6xpm-ggf7-wc3p](https://github.com/advisories/GHSA-6xpm-ggf7-wc3p) | OS command injection in `mcp-remote` through an untrusted server connection. | E02 illustrates why untrusted values must not become shell syntax; its fixed suite payload is a different, simplified pathway. |
| [Invariant Labs: tool poisoning, 2025-04-01](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks) | Instructions hidden in descriptions; a changed description can invalidate prior review. | E08 captures description hashes before/after a synthetic change. It does not contact a poisoned remote server. |
| [Invariant Labs: toxic agent flow](https://invariantlabs.ai/blog/toxic-agent-flow) | Untrusted content steers an agent across read/write capabilities. | E07 uses a synthetic injected ticket and independently observes the forbidden call being refused. No live model susceptibility was measured. |

Sources were retrieved on **2026-10-13**. The advisory mechanisms and CVE identifiers were checked. Dates and versions are evidence conditions, not permanent guarantees. A production implementation must review its own dependencies and authority boundaries; passing a classroom case proves the specific observed safeguard only.
