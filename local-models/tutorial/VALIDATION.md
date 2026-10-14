# Ollama tutorial validation — 2026-10-14

The authored tutorial is in course-root `local-models/`, distributed identically as student `local-models/tutorial/`. It adds README, six local model choices, macOS/Windows setup, optional hosted free-tier key instructions, hardware planning, JSON payloads, two curl scripts, metadata doctor, two-call smoke checks and deterministic tests. No commit, push or publication was performed.

## Executed code checks

| Check | Exact result |
|---|---|
| Scripted HTTP/contract tests | **17/17 PASS**, no inference. Covers local-only routing, cloud aliases, dummy credentials present/absent, redirects, malformed responses, unknown/multiple requests, timeouts including body stalls, truncation and byte limits. |
| Real metadata doctor | **PASS**, inference=false, calls=0, **119 ms**. Version/tags/show requests confirmed the installed local model. |
| Real Node smoke | **PASS**, inference=true, **2 calls**, **1460 ms**. One greeting plus one exact read_file request. |
| Actual macOS curl script | **PASS**, inference=true, **2 calls**. Saved JSON validated independently by check-curl.mjs. |
| Bash syntax | **PASS**, `bash -n examples/curl-macos.sh`. |
| Windows curl/PowerShell execution | **NOT RUN**; no Windows/PowerShell host was available. Commands and requirements were checked against official documentation. |
| Hosted inference | **NOT RUN**. Ollama-cloud, Groq and Gemini key/free-tier guidance is documentation only; no key was needed or forwarded by local checks. |

Actual inference used **qwen3.5:9b**, **Ollama 0.40.3**, **Apple M4 Max / 128 GiB unified memory**, loopback port11434, context8192, thinkfalse, temperature0, output cap256 for chat and512 for the tool request. The local-model selection/full-lab trials remain separately documented in [Practice03 LOCAL.md](https://github.com/sasau/algebra_ai_agents/blob/main/practice-03/LOCAL.md); no full-lab rebenchmark was needed for a documentation/tutorial extension.

Immutable actual evidence in the authored course tutorial:

- `evidence/doctor-2026-10-14T09-40-39.138Z-d135155a.json`.
- `evidence/smoke-2026-10-14T09-40-42.917Z-3b7725ec.json`.
- `evidence/curl-20261014T094116Z-41997/` with version, tags, local metadata, greeting and tool request.

The doctor runs no inference. A text response tests text access; a tool response tests one request only. No tutorial probe executes a file read, patch, test or child agent. Scripted fixtures do not establish model capability. A positive result on this host does not establish low-memory, CPU-only or Windows performance.

## Deck and preservation

Canonical Practice03 expands **51→66 slides**. The optional Ollama setup reference is **43–62**; required acts remain **1–42**, byte-identical, and final verification/submission/navigation move to63–66. The agenda remains **120 minutes** and the existing five figures and frozen shell remain intact. All eight recorded Lecture03/Practice00–02 authored/generated files retain their SHA-256 hashes.

Static gates: **verify PASS slides=66 svg=5 agenda=120 (31/31 decks)**; **lint PASS (31/31)**; links and code-width PASS. Browser navigation **11/11 PASS**, zero runtime exceptions; the immediate architecture figure and preserved68-slide lecture link both work. Setup/key/hardware/macOS/Windows/curl/test screenshots were reviewed at1366×768.

The full render comparator remains **FAIL** on inherited contrast fingerprints indexed by slide number. It was not rebaselined and the shell was not changed. At1366×768: **19 scaled, worst0.832, clipped none**. At1600×900: **3 scaled, worst0.963, clipped none**. There are **no new tag/foreground/background pairs, zoom regressions or clipping findings**; all reported contrast pairs already occur in the original practice baseline. This remains an unresolved full-gate result, not a green render claim.

Exact gate logs, screenshots, browser results, source snapshots and preservation hashes are retained under `_kit/_work/ollama-tutorial/` in the course repository. The prior Practice03 delivery/evidence under `_kit/_work/practice-03/` remains historical and unchanged. Source bands still tile through `_kit/_work/practice-03/MANIFEST.md`; only optional setup bands H and I changed.

Digest sizes after the expansion: hub **2755 bytes**, practice approximately **23 KB**, reference **11780 bytes**, preserved lecture **12569 bytes**; each remains below26KB. Course/spine/topic/setup/week indexes were updated. Student code hyperlinks await publication; all delivered targets exist locally.

## Sources and limitations

Official macOS, Windows, hardware, context, authentication, cloud, chat, tool and model-catalogue pages were retrieved on2026-10-14. Hosted key instructions were checked in Groq quickstart/rate-limit and Google AI Studio/Gemini key/pricing documentation. Ollama's checked Free plan includes starter credits and starter models; other cloud usage may need paid credits. No fixed free quotas or guaranteed model reliability are promised. Model artifacts/tags, licences, eligibility and free tiers can change.

Linux runtime execution, Windows/PowerShell execution, lower-memory/CPU timings, optional unbenchmarked models and all hosted inference remain unexecuted. The required architecture implementation continues to work with no inference and no cloud API key.
