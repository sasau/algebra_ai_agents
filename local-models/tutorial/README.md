# Ollama tutorial: free local models on macOS and Windows

**Ollama downloads and serves language models on your computer. Local inference needs no account, API key or paid provider.** You provide the disk, memory, compute and electricity. Installation and model download need internet access; downloaded local models can then run without a cloud service. A model's licence still applies; downloadable weights do not automatically mean unrestricted use.

This additional tutorial is authored in the course repository's **`local-models/`** folder and distributed in the student repository at **`local-models/tutorial/`**. Run the following tutorial commands in the folder containing this README and its `package.json`. It supplies JSON payloads, macOS/Linux and Windows curl scripts, bounded smoke checks and deterministic tests. It has **zero npm dependencies**, requires **Node 22.12+**, and needs no `npm install`.

The existing [student backend](https://github.com/sasau/algebra_ai_agents/blob/main/local-models/README.md) remains the supplied adapter for [Practice 03](https://github.com/sasau/algebra_ai_agents/blob/main/practice-03/README.md). These tutorial checks test access and single responses; they do not replace architecture verification.

## What runs where

| Component | Job | Example |
|---|---|---|
| Model weights | Downloaded numerical parameters that generate responses. | `qwen3.5:9b`; `9b` names a roughly nine-billion-parameter variant. |
| Ollama runtime/server | Loads weights, uses supported CPU/GPU hardware and serves HTTP requests. | `http://127.0.0.1:11434/api/chat`. |
| CLI or application | Sends a prompt or a message history to the runtime. | `ollama run qwen3.5:9b`, curl, or the supplied JavaScript adapter. |
| Agent host | Validates tool requests, runs permitted tools, appends observations and evaluates the result. | Practice 03's host owns `read_file`, edits, tests, retries and child boundaries. |

**An API is a program interface; it does not imply an API key.** The unauthenticated local API is intended for trusted local applications. The model cannot access project files merely because Ollama is running. A `tool_calls` response requests an operation; the application must decide whether to execute it. The tutorial records requests and executes no tools.

Keep the lab server on loopback. `127.0.0.1` refers to this computer. Port `11434` identifies the server. This tutorial rejects remote endpoints and cloud-proxy model metadata. Do not use `:cloud` or `-cloud` tags for a local inference check: Ollama can proxy a hosted model even through a localhost URL.

## API keys and optional hosted free tiers

| Route | Key/account | How to obtain access | Limits and lab status |
|---|---|---|---|
| **Ollama local** | **None.** | Install Ollama and `ollama pull` a local model below. | Limited by your hardware. Executed locally for this course. |
| **Ollama cloud** | Account; direct hosted API uses a key. | Sign in at [ollama.com](https://ollama.com), open [API key settings](https://ollama.com/settings/keys), create a key and keep it private. CLI cloud access instead uses `ollama signin`. | The [Free plan](https://ollama.com/pricing) includes starter credits and access to starter models; other usage may need paid credits. Check current models, usage and plan before a request. Not exercised by this tutorial. |
| **Groq hosted API** | Separate Groq account/key. | Sign in at [Groq Console](https://console.groq.com), open [API Keys](https://console.groq.com/keys), create a key, and follow its [quickstart](https://console.groq.com/docs/quickstart). | Check the current free-plan model and rate limits in the console. A quota is not unlimited inference. Documentation-only here. |
| **Google Gemini hosted API** | Google account/project/key. | Open [Google AI Studio API Keys](https://aistudio.google.com/api-keys), accept terms, select/create a project and create or view its key; follow [key instructions](https://ai.google.dev/gemini-api/docs/api-key). | Choose a model with an available [Free Tier](https://ai.google.dev/gemini-api/docs/pricing) in your region. Billing, quotas and data handling vary by tier. Documentation-only here. |

**A free API key does not make every model free.** Review the provider's current model prices, eligibility, quotas and data policy; do not enable paid billing as part of this lab. A key authenticates an account, not a local model file. Never paste real keys into these JSON files, local curl commands, browser code, logs or Git. The supplied local clients read no provider keys and send no authorization header. Hosted credentials belong only in the corresponding provider client. Practice 03's existing `verify:cloud` targets Anthropic; Groq, Gemini and Ollama-cloud keys are **not compatible substitutes** for that command. No hosted request is made by the tutorial tests.

Official [Ollama authentication](https://docs.ollama.com/api/authentication) distinguishes its local API, hosted keys and CLI sign-in. The required Practice 03 checks use offline fixtures and need neither a hosted account nor local inference.

## Choose a model before downloading

These exact tags were checked in the official catalogue on **2026-10-14**. Download sizes are approximate decimal GB from that catalogue; artifacts and tags can change by runtime and platform. Pull **one** model first rather than downloading the whole table.

| Exact tag and download | Useful for | Tool status and course evidence |
|---|---|---|
| [`qwen2.5:3b`](https://ollama.com/library/qwen2.5) — about **1.9 GB** | Small text/chat and low-memory transport experiments. | Advertises tools; a native probe passed. Earlier complete lab run **0/3**. Not the recommended architecture backend. |
| [`gemma3:4b`](https://ollama.com/library/gemma3) — about **3.4 GB** | Text and image chat; a small plain-chat comparison. | The checked catalogue does not advertise native tools. Use text checks only; not a substitute for this lab's tool-capable backend. Not benchmarked here. |
| [`qwen3:8b`](https://ollama.com/library/qwen3) — about **5.2 GB** | General text/reasoning and native-tool comparisons. | Advertises tools/thinking. Earlier complete lab run **0/3**. `think:false` and output bounds matter. |
| [`llama3.1:8b`](https://ollama.com/library/llama3.1) — about **4.9 GB** | Text/chat and an alternative native-tool baseline. | Advertises tools. Available candidate, **not benchmarked** for the lab; check its licence and run the probe before full verification. |
| **[`qwen3.5:9b`](https://ollama.com/library/qwen3.5)** — about **6.6–7.6 GB** | Selected backend for the small slugify agent exercise. | Advertises tools/thinking/vision. Frozen recorded lab run **3/3**; delivered wrapper run **3/3**. Required choice for the default curl payloads. |
| [`qwen3.5:4b`](https://ollama.com/library/qwen3.5) — about **3.3–4.0 GB** | A newer smaller alternative for text/tools on a tighter machine. | Candidate only, **not benchmarked** here. Lower weight size does not establish reliable delegation or repair. |

`ollama pull <exact-tag>` obtains that variant; `ollama run <exact-tag>` uses it. Avoid `latest` for evidence because it can select a different variant later. Model size, tool support and task success are three separate facts. Successful text generation does not establish tools; one valid tool request does not establish an agent loop. See the retained failures and full metadata in [Practice 03 LOCAL.md](https://github.com/sasau/algebra_ai_agents/blob/main/practice-03/LOCAL.md). These development trials involved contract refinements and are not a controlled model-ranking experiment.

## Hardware planning

**RAM** is system memory; **VRAM** is dedicated graphics memory. Apple Silicon uses a shared **unified memory** pool, so do not add RAM and GPU memory as separate capacities. Disk holds downloads; runtime memory additionally holds context, temporary computations and overhead. A **token** is a chunk of text processed by the model; longer message histories increase memory use.

| Model class | Planning system memory | Planning disk headroom | Use |
|---|---:|---:|---|
| 1–3B small models | 8 GiB | 6 GB+ | Basic chat and transport experiments. |
| Around 4B | 8–16 GiB | 10 GB+ | Small chat/tools candidates; verify runtime allocation. |
| Around 8–9B | **16–24 GiB** | **20 GB+** | Recommended lab class, allowing the OS/runtime and installation space. |
| Around 14B | 32 GiB+ | 25 GB+ | Optional comparison; not necessary for the lab. |

These are **planning recommendations, not tested minimums**. GiB uses powers of 1024; catalogue GB uses powers of 1000. Quantization stores weights with fewer bits, changing memory and quality; do not infer the format from the model name. A rough four-bit 9B calculation is 9 billion × 0.5 bytes = 4.5 GB **before** overhead and context. The selected Apple artifact was larger and did not report its quantization.

For full GPU residency of this 9B model, plan approximately **12 GiB or more available dedicated VRAM**, subject to artifact and context. A smaller GPU may split execution across CPU and GPU; it is not an automatic installation failure, but can be slower. Apple M-series supports GPU acceleration. Intel Mac uses CPU. Windows supports compatible NVIDIA and AMD hardware; consult the [official supported GPU/driver list](https://docs.ollama.com/gpu) rather than assuming every graphics card works. CPU-only inference is possible, but can exceed the lab's 60-second per-request limit.

Measured host: **Apple M4 Max, 128 GiB unified memory, Ollama 0.40.3**. The downloaded selected artifact was **7.639 GB** and loaded allocation approximately **8.842 GB** at **8192 context tokens**. This proves a run on that host, not a minimum-memory or Windows-speed claim. Check `ollama ps` after inference for allocation, `PROCESSOR` and `CONTEXT`. The tutorial requests 8192 tokens for a tiny project; Ollama's [general agent/coding guidance](https://docs.ollama.com/context-length) recommends much larger context, which costs more memory. Do not change the lab bounds to that general setting during required checks.

If your machine cannot run the recommended model, complete `verify:offline` and `verify:completed-student` in Practice 03. Required architecture implementation remains possible without model inference.

## macOS installation

1. Check **macOS Sonoma 14 or newer**. Apple M-series has CPU/GPU support; Intel/x86 has CPU support.
2. Download the DMG from [the official macOS download](https://ollama.com/download/mac).
3. Open it, drag **Ollama** to **Applications**, then launch Ollama. Accept its CLI-link prompt if needed. The app starts the background server.
4. Open a new Terminal and run the following from **any directory**:

```sh
ollama --version
ollama pull qwen3.5:9b
ollama list
```

Expected: an installed version, a successful download and a `qwen3.5:9b` list row. Common failure: `command not found`; start the app, complete its CLI setup and reopen Terminal. Save the version/model information in your submission notes. Independently check server/model metadata with `npm run doctor` below. The [official macOS guide](https://docs.ollama.com/macos) gives current OS requirements and PATH details.

## Windows installation

1. Use **Windows 10 22H2 or newer**, Home or Pro.
2. Download and run [OllamaSetup.exe](https://ollama.com/download/windows). The installer is per user and does not require administrator rights. Its binaries need at least **4 GB**, plus model storage.
3. Start Ollama from the Start menu. It runs in the background; check its tray icon.
4. Open a **new PowerShell** window, then run from **any directory**:

```powershell
ollama --version
ollama pull qwen3.5:9b
ollama list
```

Expected: the version and installed exact tag. Common failure: command not found in an old terminal; open a new one after installation. GPU acceleration needs a supported card and driver; [Windows requirements](https://docs.ollama.com/windows) currently specify NVIDIA 551.61+ or a compatible AMD driver stack. The tutorial's Windows instructions were documentation-checked; Windows execution and timings were not measured. Save version/model output; independently run the same Node doctor as on macOS.

In Windows PowerShell, use **`curl.exe`** to select the native executable; `curl` can be an alias for another command. The supplied script passes JSON through files instead of relying on native inline-JSON quoting.

## Start, use and inspect the model

On either OS, from **any directory**:

```sh
ollama run qwen3.5:9b
```

Type `Explain a URL slug in one sentence.` at its prompt. Enter `/bye` to exit chat; this does not necessarily stop the background server. Alternatively send one prompt:

```sh
ollama run qwen3.5:9b "Explain a URL slug in one sentence."
ollama ps
ollama show qwen3.5:9b
```

Expected: a generated explanation, loaded-model details and model metadata. The answer varies; it is not an assertion that code was fixed. Save model/context/processor information if benchmarking. Independently use the API smoke check rather than inferring API health from a screenshot.

Use the running desktop app. **Only if no app/service is serving port 11434**, start `ollama serve` in a separate terminal and keep it open. `address already in use` normally means a server is already running. `ollama stop qwen3.5:9b` unloads that model; it does not uninstall its weights. `ollama list` lists installed weights, whereas `ollama ps` lists models currently loaded. To stop a server started by `ollama serve`, press Ctrl+C in that terminal. Quit the app to stop an app-managed instance. Do not start a second server.

Linux uses the [official Linux installer/service](https://docs.ollama.com/linux). The bash curl examples also work there; this tutorial's main installation walkthroughs cover macOS and Windows.

## Call the local API with curl

Files: [chat.json](examples/chat.json), [tool-request.json](examples/tool-request.json), [macOS/Linux script](examples/curl-macos.sh), [Windows script](examples/curl-windows.ps1). **No key is added.** `--disable` ignores `.curlrc`; `--noproxy` prevents routing the loopback request through an environment proxy.

From the **tutorial directory**, macOS/Linux:

```sh
curl --disable --noproxy '*' --fail --silent --show-error \
  --connect-timeout 5 --max-time 60 http://127.0.0.1:11434/api/version
curl --disable --noproxy '*' --fail --silent --show-error \
  --max-time 60 http://127.0.0.1:11434/api/chat \
  -H 'Content-Type: application/json' --data-binary @examples/chat.json
```

PowerShell, same directory:

```powershell
curl.exe --disable --noproxy "*" --fail --silent --show-error --max-time 60 `
  http://127.0.0.1:11434/api/chat `
  -H "Content-Type: application/json" --data-binary "@examples/chat.json"
```

`/api/version` performs **no inference**. `/api/chat` performs inference; `stream:false` requests one complete JSON response instead of newline-delimited chunks. Expected: `done:true`, `message.role:"assistant"` and nonempty `message.content`. A failed HTTP request, incomplete JSON or `done_reason:"length"` does not pass.

Run the complete scripts to **save evidence and validate it independently**:

```sh
# macOS/Linux, tutorial directory:
bash examples/curl-macos.sh
```

```powershell
# Windows, tutorial directory; review the supplied script first.
# This changes policy only for this process, not the machine.
powershell -NoProfile -ExecutionPolicy Bypass -File .\examples\curl-windows.ps1
```

Expected: `CURL PASS inference=true calls=2` and a unique `evidence/curl-...` folder. The script checks metadata, obtains one greeting and one native `read_file` request, and runs [the saved-response checker](scripts/check-curl.mjs). No file read is dispatched. Run the checker separately with the printed folder path if inspecting evidence later:

```sh
node scripts/check-curl.mjs evidence/<printed-curl-run-folder>
```

Common failures: connection refused (start Ollama), missing model (pull the exact tag), out-of-memory/timeout (inspect resources), malformed or multiple tool requests (record a capability failure). The curl scripts deliberately use `qwen3.5:9b`; for other installed **tool-capable** candidates use `OLLAMA_MODEL` with the Node smoke route below. Do not copy hosted authorization headers into local examples.

## Run deterministic tests and real smoke checks separately

From the **tutorial directory**:

```sh
node --version
npm test
npm run doctor
npm run smoke
```

| Command | Work performed | Expected successful result |
|---|---|---|
| `npm test` | Scripted HTTP fixtures; no Ollama/server/key needed. | 17 tests pass; **no inference**. |
| `npm run doctor` | Version, installed tags and local model metadata. | `DOCTOR PASS inference=false calls=0`. |
| `npm run smoke` | Doctor followed by two actual model calls. | `SMOKE PASS inference=true calls=2`. |
| Curl script | Metadata and the same two response contracts. | `CURL PASS inference=true calls=2`. |

Doctor/smoke save immutable JSON evidence and exit nonzero on failure. Maximum two inference attempts, no retries, at most **60 seconds per HTTP request** (up to five sequential requests), **128 KiB per response**, **8192 context**, and **256/512 output tokens**. An unknown tool, extra request, wrong path, truncation, timeout or provider error fails explicitly. Even a passing smoke check establishes only two single turns: it runs no tool, source repair, test or child agent. Native responses are visible outputs, not requested private reasoning.

Select a different installed tool-capable candidate on macOS:

```sh
export OLLAMA_HOST=http://127.0.0.1:11434
export OLLAMA_MODEL=llama3.1:8b
npm run smoke
```

PowerShell equivalent:

```powershell
$env:OLLAMA_HOST = "http://127.0.0.1:11434"
$env:OLLAMA_MODEL = "llama3.1:8b"
npm run smoke
```

Download the chosen candidate first. This is an experiment, not a claim that its tool probe or full practice will pass. Restore `OLLAMA_MODEL=qwen3.5:9b` before the default lab. The tutorial rejects hosted/cloud tags and remote-model aliases.

## Verify the complete agent lab

After the tutorial smoke check, use the **student repository**, not this tutorial package:

```sh
cd algebra_ai_agents/practice-03
npm ci
npm run verify:offline
npm run verify:completed-student
npm run verify:local
```

Offline routes make scripted calls, not inference. Completed-student verification fills only a disposable copy; the distributed starter stays incomplete. `verify:local` runs all three reference acts with actual Ollama inference and independently tests the resulting source. Parent, child and reflection calls share **24 calls per act**, maximum **72 total**; each call has a 60-second timeout. Source/test permission boundaries still apply. Save each immutable report and inspect every act, including failures.

Recorded selected-model results: frozen run **3/3, 26 calls, 30.02 seconds**; delivered wrapper run **3/3, 22 calls, 26.350 seconds**. These are measured runs on the 128 GiB Apple host, not promised speeds for laptops or Windows. Passing an installed model through the complete verifier is the independent capability check. Required implementation completion does not depend on that optional model succeeding.

## Troubleshooting and submission evidence

| Symptom | Meaning and next step |
|---|---|
| `ollama` missing | Check installation, start the app and reopen the terminal. |
| Connection refused | No server at the chosen loopback address; start app or one `ollama serve`. |
| Port already in use | Usually the app owns 11434; use that instance and run doctor. |
| `MODEL_NOT_INSTALLED` / HTTP 404 | Exact model tag missing; pull it and check `ollama list`. |
| CPU split / slow first response | Model loading or insufficient GPU memory; inspect `ollama ps`, context and available RAM. |
| Timeout or memory error | Real local check failed. Preserve evidence; use offline implementation checks or a smaller comparison model. |
| Text works, tool request fails | Text generation does not establish native-tool capability. Record the failed response; do not fabricate a request. |
| Probe passes, complete lab fails | Repair, retry and delegation impose stronger requirements. Inspect the trusted evaluator and call budget. |
| API 429 from a hosted service | Provider quota/rate limit; inspect its dashboard. This is unrelated to the keyless local API. |

Submit OS/CPU/GPU/RAM, Ollama version, exact tag/digest, allocated context, immutable doctor/smoke/curl paths and separately the Practice 03 report. Do not include keys. See [VALIDATION.md](VALIDATION.md) for executed checks and platform limits.

Official sources checked on 2026-10-14: [macOS](https://docs.ollama.com/macos), [Windows](https://docs.ollama.com/windows), [GPU](https://docs.ollama.com/gpu), [context](https://docs.ollama.com/context-length), [authentication](https://docs.ollama.com/api/authentication), [chat](https://docs.ollama.com/api/chat), [tools](https://docs.ollama.com/capabilities/tool-calling), [cloud](https://docs.ollama.com/cloud), model catalogue links and hosted-provider links above. Windows/Linux execution, lower-memory/CPU performance and hosted inference are not established by documentation checks.
