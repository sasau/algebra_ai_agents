# Setup

Use Node **22.12 or newer** (tested with 22.23.2), npm, and a terminal. No cloud account is required. Install Node from [nodejs.org](https://nodejs.org/en/download), or use your existing version manager. The pinned package lock contains TypeScript, tsx and esbuild; the latter transpiles the disposable evaluator source before Node's permission checks apply.

From an existing student clone, change to its practice folder (from the parent directory of `algebra_ai_agents`):

```sh
cd algebra_ai_agents/practice-03
node --version
npm ci
npm run doctor
npm run typecheck
npm test
```

Expected: Node >=22.12, `DOCTOR PASS`, no type errors, and infrastructure tests pass. The starter has three deliberate throwing TODO regions but typechecks. If `npm ci` reports a network/cache error, configure your organization's npm registry or use the public registry according to your environment; installation needs downloaded packages once. Required architecture verification afterward is offline and needs no inference service.

```sh
npm run fixture:test
npm run verify:offline
npm run verify:student
npm run verify:completed-student
```

Expected initial state: fixture **1 pass / 1 fail**; reference **4/4 PASS**; untouched starter **0/4 FAIL** with TODO errors; completed disposable starter **4/4 PASS**. These are different checks, not contradictory outcomes. Do not edit the fixture to turn the reproduction green.

Only `starter/react-agent.ts`, `starter/reflexion.ts`, and `starter/delegate.ts` contain student TODOs. Follow [README.md](README.md) in order. All source workspaces, evaluator processes and implementation verification copies are temporary and removed afterward. Save immutable evidence files printed by commands; stable `.json` filenames show only the latest result.

For actual inference, follow the reusable root [local-models tutorial](../local-models/README.md), then [LOCAL.md](LOCAL.md) for this lab’s full-act benchmark. The supplied local adapter connects only to a loopback Ollama server; never put a provider API key in `OLLAMA_HOST` or a proxy. Offline/local do not use dotenv and send no provider credentials. A shell may contain unrelated keys, but no such key is attached to these requests. Keep cloud credentials in your shell or approved secret store, separate from local configuration.

Cloud is optional and bounded:

```sh
npm run verify:cloud -- --run-cloud
```

Without `ANTHROPIC_API_KEY`, this prints and saves `SKIP`. Without the explicit flag, it also skips even when a key exists. With both, it uses the official `https://api.anthropic.com/v1/messages` endpoint and `claude-haiku-4-5-20251001` by default; set `CLOUD_MODEL` only if your account requires another available model. There is no configurable cloud endpoint and no cloud fallback from offline/local. A cloud run can make at most 24 model calls per act (3 acts, at most 72 calls) and 2048 output tokens per call. Provider billing applies only after explicit opt-in.

No Docker, Claude Code, cloud key or model download is required for the three implementation checks. Test transcripts are visible message/action/result records; they are not private chain-of-thought.
