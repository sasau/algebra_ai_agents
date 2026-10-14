# Free local model backend for the course

[Expanded Ollama tutorial](tutorial/README.md): what Ollama is, separate macOS/Windows setup, keyless local models versus hosted free-tier keys, six model choices, hardware planning, curl payloads/scripts and 17 deterministic checks plus bounded real smoke tests. Its standalone commands run inside `local-models/tutorial/`; this folder retains the supplied architecture backend.

Run a real model on your own computer through **Ollama**, without a cloud API key. This folder supplies a reusable JavaScript adapter, a server/model check, a one-call native tool probe and transport tests. It has **zero external npm dependencies** and requires **Node >=22.12**. Required Practice 03 implementation checks also work entirely offline; a model download is optional for those checks.

A local model can request a tool, but the application still owns tool permissions, dispatch, message history, evaluation and retries. A successful probe proves one correctly formed request; it does not prove that a model can complete the three Practice 03 acts. See the measured full-lab results and smaller-model comparisons in [Practice 03 LOCAL.md](../practice-03/LOCAL.md).

## 1. Obtain the course examples and Node

Install Node >=22.12 from [nodejs.org](https://nodejs.org/en/download). If you already cloned the student repository, use your existing checkout. Otherwise run:

```sh
git clone https://github.com/sasau/algebra_ai_agents.git
cd algebra_ai_agents/local-models
node --version
npm test
```

Working directory for the following `npm` commands: **`algebra_ai_agents/local-models`**. No `npm install` or `npm ci` is needed. Expected test result: **12 tests, 12 pass**. These tests use mock HTTP transports, run without Ollama and perform **no inference**. Save output with `npm test > evidence/backend-tests.txt` if needed.

## 2. Install and start Ollama

Use the official instructions for your operating system. Installers and model downloads require internet access once; inference then runs locally.

| System | Installation | Startup |
|---|---|---|
| macOS | Download the official [macOS app](https://ollama.com/download/mac), open the DMG and drag Ollama to Applications. Current official requirements are macOS 14 or newer. | Open Ollama from Applications. The app starts its background server and exposes `ollama` in the terminal. Apple Silicon supports GPU/CPU execution; Intel Mac uses CPU. |
| Windows | Download and run [OllamaSetup.exe](https://ollama.com/download/windows). The official installer supports Windows 10 22H2 or newer and installs per user without administrator privileges. | Start the installed app and open a **new** PowerShell terminal so `ollama` is on PATH. The app runs the background server. |
| Linux | Run the official installer command below after reviewing it. It downloads and executes the Ollama installation script. | The installer can configure a service. If no server is running, use `ollama serve` in a separate terminal. |

Linux installer, from the [official Linux instructions](https://docs.ollama.com/linux):

```sh
curl -fsSL https://ollama.com/install.sh | sh
```

Check the installed CLI from any terminal:

```sh
ollama --version
```

If the desktop app/service is already serving port 11434, keep it running. Otherwise start the server in a separate terminal and leave that terminal open:

```sh
ollama serve
```

Expected server address: **`http://127.0.0.1:11434`**. `address already in use` usually means the app or service already started it; return to the tutorial terminal and run the doctor check. Do not start a second copy.

Official installation references: [macOS](https://docs.ollama.com/macos), [Windows](https://docs.ollama.com/windows), [Linux](https://docs.ollama.com/linux).

## 3. Download the selected tool-capable model

From any terminal with the CLI on PATH:

```sh
ollama pull qwen3.5:9b
ollama list
```

The model is **Qwen 3.5 9B**. Allow several GB of download/storage. On the measured Apple machine, Ollama 0.40.3 downloaded a 7.639 GB MLX/safetensors build; packaging, download size and performance can differ by platform. The measured loaded allocation was approximately 8.842 GB with an 8192-token context. **16 GiB system memory is a planning recommendation**, not a measured minimum or a guarantee on every CPU/GPU. Keep additional disk space for the Ollama installation, temporary downloads and other models. A CPU-only machine can be much slower.

The smaller `qwen2.5:3b` and `qwen3:8b` candidates requested a tool in simple probes but failed the complete lab benchmark. Do not equate a model's advertised `tools` capability or a successful single call with reliable source repair or delegation. Full results belong in [Practice 03 LOCAL.md](../practice-03/LOCAL.md), separately from offline scripted fixtures and optional cloud inference.

## 4. Check server readiness without inference

Return to **`algebra_ai_agents/local-models`**:

```sh
npm run doctor
```

Expected output begins:

```text
DOCTOR PASS inference=false server=<version> model=qwen3.5:9b installed=true evidence=evidence/doctor-<unique>.json
```

This makes only `GET /api/version` and `GET /api/tags`. It does **not** run a model. Missing server produces `DOCTOR FAIL`; start Ollama. Missing model produces `MODEL_NOT_INSTALLED`; run `ollama pull qwen3.5:9b`. Each run saves an immutable JSON file and a latest convenience copy at `evidence/doctor.json`.

## 5. Run one actual native tool-request probe

From **`algebra_ai_agents/local-models`**:

```sh
npm run probe
```

Expected successful output begins:

```text
PROBE PASS inference=true calls=1 model=qwen3.5:9b elapsedMs=<n> evidence=evidence/probe-<unique>.json
```

The model receives a source-inspection task and one `read_file` tool definition. Success requires exactly one request for `src/slugify.ts`. The probe records the **actual native response** and elapsed time. It **does not execute the requested read**, repair any source, run tests or delegate. A natural-language answer, multiple calls, the wrong path, truncation or a provider timeout is a probe failure and remains saved evidence. First-call model loading can make this slower than subsequent calls.

Save the immutable path printed by the command. `evidence/probe.json` is only the latest alias and can change on a rerun. Generated machine-specific evidence is ignored by Git but remains on disk. Do not label `npm test` output or a fixture as actual inference.

## 6. Use the supplied backend in a program

[`ollama.mjs`](ollama.mjs) exports one-call `chat({messages, tools}, options)` and no-inference `inspect(options)`. The adapter returns the **native Ollama JSON response**. It does not execute tools or run an agent loop.

```js
import { chat } from './ollama.mjs';

const native = await chat({
  messages: [{ role: 'user', content: 'Reply with one short greeting.' }],
  tools: []
});
console.log(native.message.content);
```

For the complete tool declaration and visible request contract, read [`scripts/probe.mjs`](scripts/probe.mjs). The application must validate a tool request and its arguments, execute only permitted tools, append the assistant message including **all** `tool_calls`, then append matching tool results before another model call. Native Ollama examples include `role:'tool'`, `tool_name:<name>` and string `content`. Practice 03's supplied adapter also pairs results with generated IDs for its common message format. Multiple tool requests are returned intact by this reusable transport; Practice 03 rejects the whole multi-call turn explicitly under its single-tool-per-turn lab contract.

Default supplied bounds are: one HTTP call, 60-second timeout including response body, 128 KiB response limit, non-streaming `/api/chat`, `think:false`, temperature 0, `num_ctx:8192`, and `num_predict:2048`. A truncated response fails explicitly. The 8192-token context is a small-lab constraint, not Ollama's general recommendation for coding agents; [Ollama's context guide](https://docs.ollama.com/context-length) recommends much larger contexts for broader agent/coding work. This adapter deliberately has no automatic retry or cloud fallback.

Configuration is restricted to a loopback HTTP host and model name. Defaults work without environment changes. To select another installed model on macOS/Linux:

```sh
export OLLAMA_MODEL=qwen3.5:9b
export OLLAMA_HOST=http://127.0.0.1:11434
npm run probe
```

PowerShell equivalent:

```powershell
$env:OLLAMA_MODEL = "qwen3.5:9b"
$env:OLLAMA_HOST = "http://127.0.0.1:11434"
npm run probe
```

The transport reads no provider keys, adds no `Authorization` or API-key header and loads no `.env` files. Keep cloud credentials separate. Remote URLs, HTTPS URLs, embedded credentials, query strings and custom endpoint paths are rejected. `localhost`, `127.0.0.1` and `[::1]` are supported loopback hosts.

Native API reference: [chat](https://docs.ollama.com/api/chat) and [tool calling](https://docs.ollama.com/capabilities/tool-calling).

## 7. Verify all Practice 03 acts with actual local inference

First follow [Practice 03 setup](../practice-03/SETUP.md), including `npm ci` in that folder. Then, from **`algebra_ai_agents/local-models`**:

```sh
npm run verify:practice-03
```

This launches the sibling command `npm --prefix ../practice-03 run verify:local`, preserving the selected `OLLAMA_HOST`/`OLLAMA_MODEL` while removing provider-key variables from the child environment. It runs the **reference** ReAct, Reflexion and delegation acts with actual local inference, independently checks the saved source, and saves a separate wrapper result. The underlying practice evidence reports parent, child and reflection model calls. Every act shares a 24-call budget across those roles; all three acts therefore permit at most **72 calls**, with 60 seconds per call and bounded source evaluation. The wrapper has a 75-minute outer limit; the normal benchmark is much shorter. An honest model failure is a valid result, not permission to substitute scripted replies.

Run `npm run verify:offline` and `npm run verify:completed-student` **inside `practice-03`** to verify architecture without inference. Those routes use deterministic fixtures and do not establish model capability. Optional cloud integration remains separate; it skips when credentials are absent and is never invoked by this folder. See [Practice 03 LOCAL.md](../practice-03/LOCAL.md) for observed full-act results, limits and the separately checked Claude Code–Ollama instructions.

## Troubleshooting

| Observed failure | Check and next action |
|---|---|
| `ollama` command is missing | Start the installed app; open a new terminal so PATH updates apply. Check the official instructions for your OS. |
| Connection refused / `DOCTOR FAIL` | Start the app, service or `ollama serve`; use the same loopback host in the tutorial terminal. |
| `MODEL_NOT_INSTALLED` / provider model-not-found | Run `ollama pull qwen3.5:9b`, then `ollama list` and `npm run doctor`. |
| Timeout or out-of-memory | Close other memory-heavy applications; check memory/context requirements. A timeout is a failed real-model run. Keep the saved evidence. |
| Probe passes but the complete practice fails | The probe tests one request only. Inspect the practice's failed checkpoint and actual messages; model capability varies by task. |
| Truncated/malformed tool response | The adapter fails explicitly. Inspect native evidence; do not silently discard requests or claim completion. |
| `PRACTICE_03_NOT_FOUND` | Keep `local-models` and `practice-03` as sibling folders in the student repository. |

The local server and Node permission-based evaluator are teaching tools, not an OS sandbox for hostile code. Review code you execute locally. No paid provider API is required; local compute still uses your computer's memory, disk and electricity.
