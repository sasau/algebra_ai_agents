# Supplied transcripts

Files ending `.observed.json` are actual reference captures from 2026-10-13, with timestamp, Node version and selected variant in each wrapper. E01/E02 contain raw stdio JSON-RPC; workspace discovery uses a real stdio SDK client. E06 records two separately started ticket MCP processes and an independent SQL count. `db-probe` explicitly labels its SDK in-memory transport. Other captures are deterministic boundary observations, not evidence of model reasoning.

These captures were taken during implementation; run IDs, temporary paths, timings and hashes will differ on another machine. Earlier captures preceded the repository relocation, which does not change their protocol/handler observations. Use your own `work/evidence` files in a student submission and label supplied evidence separately.

`api-pairing.illustrative.json` is a synthetic offline teaching exchange. No model API call was made to generate it; it makes no token, stop-reason or host-context claim. Compare it with `src/direct/live.ts` if the optional paid exercise is executed.

No capture includes database passwords or model credentials. Synthetic canaries are deliberately harmless. Read `docs/protocol-and-traces.md` before interpreting an SDK error as a protocol or domain error.
