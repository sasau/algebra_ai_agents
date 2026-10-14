# Local inference with the supplied Ollama adapter

The required architecture checks use `npm run verify:offline` and need no model or API key. `npm run verify:local` runs actual inference through the supplied native Ollama adapter. Scripted fixtures establish harness behavior; the separate local run measures this model on this small task. Neither proves general coding capability.

## Install and start

The tested version is **Ollama 0.40.3**. Follow the repository's [local-model setup tutorial](../local-models/README.md), or install the official application from [ollama.com/download](https://ollama.com/download). On macOS, drag the app into Applications and start it; the current [macOS requirements](https://docs.ollama.com/macos) specify macOS 14 or newer, Apple M series with CPU/GPU support, or x86 with CPU support. The [Windows requirements](https://docs.ollama.com/windows) specify Windows 10 22H2 or newer and a per-user installer; the application runs in the background. On Linux the official [installation instructions](https://docs.ollama.com/linux) provide an installer and service configuration. Installation and model download require internet access; inference after downloading the model runs locally.

In any terminal working directory:

```sh
ollama --version
ollama pull qwen3.5:9b
```

Expected: a version line, then `success`. The selected [tool-capable model tag](https://ollama.com/library/qwen3.5:9b) is **qwen3.5:9b**. On the tested Apple Silicon/Ollama version it resolves to a **7.64 GB safetensors model using the MLX runner**. The API does not report a quantization level for this artifact; it must not be described as Q4_K_M. Its tested digest is `d63f830f28d515fefea546f213fca7a75e9dd5176ef51a6deabc952d1c99a911`. Other platforms or versions may select a different artifact. Tags can change; record `ollama list` with your submission.

Start the app, or keep a separate terminal running this server command:

```sh
OLLAMA_HOST=127.0.0.1:11434 ollama serve
```

Expected: the server listens on loopback port 11434. `address already in use` commonly means the app/server already owns that port; use the existing instance. `connection refused` during verification means it has not started or the configured host differs. Do not expose this lab server on a public interface.

In the companion repository root:

```sh
cd algebra_ai_agents/practice-03
npm ci
OLLAMA_HOST=http://127.0.0.1:11434 OLLAMA_MODEL=qwen3.5:9b npm run verify:local
```

This command runs real inference through the completed reference. The required offline route separately verifies the reference and disposable completed-student implementations. Save the generated local verification report and `ollama list`; read each act's outcome instead of treating a successful HTTP response as a repaired function. If the server reports a missing model, repeat the exact `ollama pull qwen3.5:9b` command. A model without tool support is unsuitable. Rejected requests and failed checks remain visible in the evidence; a timeout, exhausted budget or unmet final checkpoint causes failure. Use the saved trace to diagnose it.

## Resources and bounds

Allow at least **12 GB free disk** for this model and temporary files, in addition to Node dependencies and the Ollama installation. Windows installation itself requires at least 4 GB according to its current documentation. **16 GiB system RAM is a planning recommendation**, not a minimum established by this benchmark. The tested host has substantially more memory. The measured loaded model occupied **8,842,107,480 bytes** with an 8,192-token allocation; the OS, Node, Ollama runtime and other applications require additional memory. This benchmark verifies Apple Silicon/MLX execution. Other operating systems, CPU inference and lower-memory hosts were not benchmarked; CPU inference can exceed the lab's timeout. Check `ollama ps` for context and CPU/GPU allocation. The required offline checks remain available on a machine that cannot run this model.

The supplied adapter fixes `stream: false`, `think: false`, `temperature: 0`, `num_ctx: 8192`, and a bounded output-token allowance. An 8k context is intentional for the tiny, bounded slugify project; histories must remain small. The [general Ollama context guidance](https://docs.ollama.com/context-length) recommends 64k or more for larger coding and agent workloads. Increasing context consumes additional memory. The model's advertised context size is not a claim that this host has allocated it.

No provider key is needed. The native local adapter uses `/api/chat` without an Authorization header and never copies provider credentials into local requests. Cloud access has its own explicit route and endpoint policy. A model's requested file path or tool is untrusted input; the supplied host still checks paths, roles, budgets and return shapes.

## Executed local trials

Recorded on **2026-10-14**, **Apple M4 Max, 128 GiB unified memory, arm64, macOS 26.7.1**, using **Ollama 0.40.3** on `http://127.0.0.1:11434`.

| Real inference trial | Checkpoints passed | Total model calls | End-to-end time | Observation |
| --- | ---: | ---: | ---: | --- |
| `qwen2.5:3b`, 3.1B Q4_K_M | 0/3 | 14 | 29.88 s | Removed a named export, misread feedback, attempted a protected write; no child report. |
| `qwen3:8b`, 8.2B Q4_K_M | 0/3 | 26 | 93.92 s | Repeated a source syntax error; one response was truncated. |
| `qwen3.5:9b`, MLX, initial contract | 2/3 | 16 | 17.50 s | Source repair worked; an invalid child role prevented delegation. |
| `qwen3.5:9b`, stronger acceptance checks | 1/3 | 26 | 26.29 s | Act 2 recovered through an actual reflection call; Act 1 reached its turn limit, and Act 3 requested an excessive child limit. |
| **`qwen3.5:9b`, final frozen contract** | **3/3** | **26** | **30.02 s** | All source and architecture checkpoints passed; invalid child reports were rejected before a valid return. |

The final run used **5 parent calls for Act 1**, **5 parent calls for Act 2**, and **8 parent plus 8 child calls for Act 3**. Each act has a shared 24-call limit; parent, child and reflection calls all consume it. Act 2 passed its first attempt in this run and made **zero reflection calls**. The preceding retained trial separately demonstrates an actual failed attempt, one model-written lesson and a changed second attempt that passes. Act 3 used three sequential fresh child histories, consuming 3, 3 and 2 calls; the first two reports were rejected, the third met the return contract, and the parent independently tested the saved source. No child could edit, execute tests or delegate.

The exact final output is [evidence/local-qwen35-9b-final-verification.log](evidence/local-qwen35-9b-final-verification.log), with immutable summary [evidence/verify-local-2026-10-14T08-40-30-233Z-b32589ce.json](evidence/verify-local-2026-10-14T08-40-30-233Z-b32589ce.json). [The frozen run metadata](evidence/local-qwen35-9b-frozen-run-metadata.json) records complete source hashes, model settings and unchanged budgets. This is one passing run on one host, not a guarantee that another run or machine will pass.

These are individual development trials, not a controlled comparative benchmark: tool descriptions became more explicit and trusted checks gained previously missing underscore cases. The acceptance rule, call budget and delegation restrictions were retained. Both a green saved source and the architecture checkpoints must pass. A source repaired on the last allowed tool turn can still fail the completion checkpoint. Temperature zero does not guarantee the same response on another runtime or hardware. A written lesson does not guarantee model improvement.

All model failures are retained under `evidence/local-qwen25-3b-*`, `local-qwen3-8b-*`, `local-qwen35-9b-first-*` and `local-qwen35-9b-stricter-*`; their logs give the exact command and immutable report links. The initial read-file-only probes are saved in [evidence/local-probe.json](evidence/local-probe.json); their success established tool selection, not task capability. [evidence/local-models-qwen35-9b.json](evidence/local-models-qwen35-9b.json) and [evidence/local-loaded-qwen35-9b.json](evidence/local-loaded-qwen35-9b.json) record the selected artifact and measured memory. No fixture responses or cloud calls were used in these local trials. [Ollama's tool-calling documentation](https://docs.ollama.com/capabilities/tool-calling) shows the native protocol: append the assistant response containing `tool_calls`, then append the corresponding `role: "tool"` response before requesting the next model turn. The lab's stricter single-tool contract is enforced in the host.

## Claude Code boundary

This lab does not require Claude Code. Its `.claude/agents/` role examples explain delegation configuration; required local checks use the supplied native adapter. The current [official Ollama Claude Code guide](https://docs.ollama.com/integrations/claude-code) documents an Anthropic-compatible route and recommends 64k+ context. That separate integration was **documentation-checked, not executed**, and the 8k/Qwen3.5-9B native-adapter benchmark does not validate it. Consequently this guide supplies no untested Claude Code–Ollama launch recipe.
