# Practice 03 — final verification, 2026-10-14

Implemented the canonical guided deck, self-contained Practice 03 code, documentation, submission template and shared root Ollama backend. No commit, push or publication was performed.

## Delivered files and startup

- Course authored source: `_kit/_staging/practice-03-architectures-slides.frag.html`; generated deck: `practices/practice-03-architectures-slides.html` (51 pages, five figures, 120 minutes). Source bands and original snapshots: `_kit/_work/practice-03/`.
- Student companion: `/Users/auscumlic/Development/algebra/practices/practice-03` — three incomplete starter TODOs, completed reference, supplied host/adapters, trusted evaluator, tests, README/SETUP/LOCAL/SUBMISSION and `.claude/agents/slug-explorer.md`.
- Shared free model backend: `/Users/auscumlic/Development/algebra/practices/local-models` — OS setup tutorial, `ollama.mjs`, doctor, mock tests, actual probe and bounded Practice 03 wrapper. Zero external npm dependencies.
- Course metadata: `index.html`, `lab-setup.html`, `CLAUDE.md`, `COURSE_OUTLINE.md`, `weeks/session-03.md`, topic plan/index and split summaries/index. Student root README links both new folders.

Required checks, from the delivered companion directory:

```sh
cd /Users/auscumlic/Development/algebra/practices/practice-03
npm ci
npm run doctor
npm run typecheck
npm test
npm run verify:offline
npm run verify:completed-student
```

The distributed starter intentionally remains incomplete; `npm run verify:student` must fail until students fill the three TODOs. `npm run fixture:test` intentionally reproduces one pass and one fail. Completed-student regression fills only a disposable copy; it does not implement a student's working starter.

Free actual-inference route, after official Ollama installation, with one app/service or `ollama serve` running:

```sh
ollama pull qwen3.5:9b
cd /Users/auscumlic/Development/algebra/practices/local-models
npm test
npm run doctor
npm run probe
npm run verify:practice-03
```

From practice-03 itself, `npm run verify:local` uses the same selected backend. Cloud is separate: `npm run verify:cloud -- --run-cloud`, requiring a provider key and explicit opt-in. Never substitute fixture output for real inference.

## Exact delivered code results

| Check | Result | Evidence |
|---|---|---|
| Fresh pinned npm ci | PASS:8packages,0vulnerabilities | Corrected public-registry lock; initial missing TypeScript native optional entries fixed before final validation. |
| Doctor / typecheck | PASS | `practice-03/evidence/final-delivered-doctor-20261014T084541Z.txt`, corresponding typecheck log. |
| Architecture/infrastructure tests | 30/30PASS,0fail | `practice-03/evidence/final-delivered-infrastructure-20261014T084541Z.txt`. |
| Original reproduction | 2tests:1pass/1fail,expected exit1 | `practice-03/evidence/final-delivered-fixture-20261014T084541Z.txt`. |
| Reference offline | 4/4PASS,29scriptedcalls,no inference | `practice-03/evidence/verify-offline-2026-10-14T08-45-49-345Z-70d8a135.json`. |
| Completed student | 4/4PASS,filled3regions in disposablecopy | `practice-03/evidence/verify-completed-student-2026-10-14T08-45-50-768Z-6f639d3b.json`. |
| Untouched starter | 0/4FAIL,expected exit1 | `practice-03/evidence/verify-student-2026-10-14T08-45-49-744Z-d2d56cc4.json`. |
| Starter and fixture preservation | SHA-256unchanged after all checks | `practice-03/evidence/final-delivered-verification-20261014T084541Z.json`. |
| Shared backend mock tests | 12/12PASS,no inference | Delivered `local-models` npm test; transport evidence includes dummy-present/absent keys. |
| Backend readiness | PASS,Ollama0.40.3,modelinstalled,no inference | `local-models/evidence/doctor-2026-10-14T08-45-46-631Z-4a1da936.json`. |
| Real native tool probe | PASS,1call,1911ms | `local-models/evidence/probe-2026-10-14T08-45-48-670Z-3a3e2e4c.json`. |
| Real local frozen selection run | 3/3PASS,26calls,30.02s | `practice-03/evidence/verify-local-2026-10-14T08-40-30-233Z-b32589ce.json`. |
| Real local delivered wrapper | 3/3PASS,22calls,26.350s | `practice-03/evidence/verify-local-2026-10-14T08-46-15-159Z-718b4427.json`; `local-models/evidence/verify-practice-03-2026-10-14T08-46-15-166Z-01d375a7.json`. |
| Real cloud | SKIP:ANTHROPIC_API_KEYabsent | `practice-03/evidence/verify-cloud-2026-10-14T08-45-50-967Z-8192fae7.json`. |
| Dummy key present, no explicit opt-in | SKIP:requires --run-cloud;no provider request | `practice-03/evidence/verify-cloud-2026-10-14T08-45-51-149Z-be027189.json`. |

Delivered local per-act calls were5parent,5parent,7parent+5child; no reflection call in that passing run. The retained preceding real trial contains failure→one reflection call→changed passing attempt. Every parent/child/reflection call consumes the same24-call per-act budget; three-act inference maximum72. Child depth is1, only one child runs at a time, and subsequent bounded child invocations are allowed if a return is rejected. Source passes five trusted tests independently after the loop.

The selected model is `qwen3.5:9b`, tested on Apple M4 Max128GiB with Ollama0.40.3,8192context,2048output cap,thinkfalse,temperature0. On this host the tag resolves to a7.639GB MLX/safetensors artifact (quantization unreported), loaded8.842GB. Smaller3b/8b candidates failed full acts despite tool probes; failures remain recorded. Results are development trials with explicit contract/check refinements, not a controlled model-ranking experiment or a reliability guarantee. Native backend probes prove a single request only.

## Deck gates and browser checks

Static gate after digest/index refresh:

```text
=== gate practice-03-architectures ===
assemble    OK    practices/practice-03-architectures-slides.html  slides~51  svg=5
verify      PASS  slides=51 svg=5 agenda=120   (31/31 decks pass)
lint        PASS  (31/31 clean)
links       PASS  (283 hrefs across 32 files)
code-width  PASS
render      skip  pass --render if the edit changed a slide's volume
digest      ok    summaries/session-03-practice.md also changed — check its slide table matches
GATE PASS
```

Full render comparator:

```text
=== gate practice-03-architectures ===
assemble    OK    practices/practice-03-architectures-slides.html  slides~51  svg=5
verify      PASS  slides=51 svg=5 agenda=120   (31/31 decks pass)
lint        PASS  (31/31 clean)
links       PASS  (283 hrefs across 32 files)
code-width  PASS
render      FAIL
    1366x768: 15 scaled, worst 0.837, clipped none
    1600x900: 2 scaled, worst 0.981, clipped none
digest      ok    summaries/session-03.md also changed — check its slide table matches
GATE FAIL
```

The render FAIL remains unresolved as a baseline-comparison result:109slide-indexed contrast fingerprints use exactly seven tag/foreground/background combinations, all present in the original18-page practice baseline. New colour pairs=[],zoom regressions=[],clipped=[] at both viewports. Source layout is comfortably above the0.6floor:worst0.837@1366×768,0.981@1600×900. Shell and baseline were preserved. This is not reported as a green full render gate. Evidence:`render-check.json`, `render-measurements.json`, `layout-assessment.txt` and `gate-full.txt`.

Independent cold-read review:51PASS,0FLAG,7/7concepts have worked examples (`clarity-review.txt`). Nine authored-band prechecks PASS. GitHub companion target audit12/12localfilespresent; publication intentionally not performed. Browser navigation10/10PASS:next/previous/keyboard/end, immediate architecture figure, lecture/hub links and preserved68-pagelecture load,0runtimeexceptions (`browser-navigation.json`). Screenshots of architecture,memory,setup,OSinstallation and verification were visually reviewed for readability/code overflow. The favicon404 observed by one browser check is unrelated to the deck runtime.

## Preservation and remaining limits

All eight recorded Lecture03/Practices00–02source/output hashes match (`preserved-decks.json`). Original Practice03 source/deck/digest are saved as before-*; all intermediate failures and immutable evidence remain. Prior companion deliveries were copied and SHA-256verified before corrections (`companion-before-update-manifest.json`, `companion-before-final-manifest.json`); conflicting evidence aliases were imported separately. Existing practice00–02 code was not changed.

Cloud inference was unavailable; Claude Code–Ollama execution, Windows/Linux execution and lower-memory/CPU performance were not run. Official setup and integration documentation was verified; no untested Claude Code launch recipe is taught. Required implementation checks need no model or key. Node permission-based evaluation is a teaching boundary, not a full OS sandbox for hostile source. The full render comparison failure described above is the remaining deck gate. Local GitHub-linked code has not been committed or pushed.

## Course digest sizes

Hub2400bytes; lecture12569bytes; practice20122bytes; retained reference10458bytes. Each part remains under26KB. All hub/part relative links resolve.
