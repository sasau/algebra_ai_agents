# Validation — Optional progressive practice

Executed 2026-10-28 in disposable project copies. Student root remains unbuilt;
the reference is a separate completed answer key. Temurin 21.0.10, Maven 3.9.9,
Java release21; pinned JUnit 5.11.4 and Surefire 3.5.2. Local verification used a
prepared Maven cache/settings outside the shipped kit; no machine-specific paths
or settings are required by the practice source.

| Check | Observed result |
|---|---|
| Bootstrap without JUnit | Package passes; hello RESULT matches, exit0/empty stderr. |
| Empty list / unknown route | No cases listed initially; invalid route exits2. |
| All cases before JUnit | Ten real mains pass observation and fixed-result checking. |
| Final reference |30 tests,0 failures/errors/skips;10 main comparisons pass. |
| Live subset01/03/06 |9 tests,0 failures/errors/skips;3 main comparisons pass. |
| Observation without expected/ | Works; checks_passed is null and no comparison is claimed. |
| Wrong printed RESULT label | Unit suite and observation pass; expected check fails. |
| Extra explanatory stdout | Check passes while retaining full narration in evidence. |
| Missing mode / observe+tests | CLI rejects invalid usage with exit2. |

Each main has explanatory stdout, results calculated from actual method calls
and concise source documentation. Fixed RESULT lines permit narration updates.
Observe mode and check mode are explicit. A fresh build precedes launch; final
mode additionally reads Surefire reports and requires tests in each implemented
case package.

Teaching materials: 21 separate process prompts,10 complete case conversations,
four inactive/final skills and two seven-section role examples. Slides and
companion prompts were compared directly.42 student Markdown links resolve.
The initial root contains no project, active roles/skills or execution tool.
Students build them from the prompts; they do not copy the reference first.

## Verification — 2026-10-28 graphics revision

- Static gate: slides=113, SVG=24 (23 teaching figures plus badge), agenda=120;
  verify33/33, lint33/33, links486 across34 files and code width all pass.
- SVG and SVG-style prechecks pass. The existing clarity warning on slide67
  lists seven follow-up cases, preserving the one-to-one curriculum map.
- Actual Playwright MCP inspected all113 pages at1600×900 and1366×768
  (226 page/viewport combinations). No clipping, text collisions, containment
  failures or console errors; the Algebra badge loads on all pages. Changed
  pages were reviewed in contact sheets at both sizes and enlarged screenshots.
- Render1600×900: 2 scaled, worst0.959, no clipping. Render1366×768:
  28 scaled, worst0.818, no clipping. The previous113-page artifact had worst
  zoom0.922/0.787 respectively. Added mechanism figures account for the newly
  scaled pages; they were inspected visually. No type or shell CSS was reduced.
- Raw render exits1 / RENDER GATE FAIL: this supplementary slug has no baseline
  and reports352 contrast instances per viewport. All9 tag/foreground/background
  signatures match the preceding artifact and existing course baselines; there
  are no new signatures. Six extra caption instances follow the added figures
  and removal of one redundant info box. No baseline was reset.
- Source comparison: 23 illustrated pages changed; the other90 pages and all62
  copyable student prompts are byte-identical. Titles, leads, timing and the
  institutional-mark prelude are preserved. The slide112 info box is consolidated
  into its figure caption to keep the diagram and commands readable together.
- All23 figures were newly authored through actual Claude Sonnet/medium CLI
  calls:16 replacements and7 additional illustrated mechanism pages. Each has
  an individual brief, raw response and provenance. Local refinements correct
  Java types, fixture excerpts, flatMap edge labels, OptionalInt's actual
  ifPresentOrElse path, spacing and conditional-repair presentation.
- Hash guards preserve32 official decks, the render baseline and every student
  kit file except this QA note. Java, prompts, roles, skills, fixtures and CLI
  source are unchanged; the graphics revision does not rerun Java tests.

Earlier implementation validation (unchanged): Temurin21.0.10 and pinned Maven
3.9.9; all10 pre-JUnit mains pass observe/check; final30 tests and10 main checks
pass; live01/03/06 subset9 tests and3 main checks pass. Negative CLI checks cover
observation without fixtures, wrong RESULT labels, extra narration and invalid
modes. The21 process prompts and10 case conversations still match displayed
prompts;42 student Markdown links resolve. These are reference results, not
student execution evidence or a claim about cohort timing.

Evidence: `/private/tmp/optional-graphics-v2-20261028` (individual Claude briefs,
raw outputs, SVGs, corrections, browser JSON, render results and guarded install
plan/backups). Earlier Java evidence: `/private/tmp/optional-guided-dialogue-20261027`.
No commit or push was made.

## Agent discovery and Git placeholders — 2026-10-28

The starter now includes an empty `.claude/agents/.gitkeep`, so Git can preserve
this directory without installing an active role. It was the only empty leaf
directory in Practice01; reference Java packages already contain source/tests.
README and slide7 distinguish automatic agent-file discovery in directories
present at startup from newly created directories, which require one restart
with `claude --continue`. This follows the current primary documentation:
https://code.claude.com/docs/en/sub-agents#write-subagent-files.

Verification: only slide7 changed; all113 pages, copyable code blocks and24 SVGs
are otherwise preserved. Static gate passes (113 slides,24 SVGs,120 minutes;
verify/lint33 of33;486 links;code width). Playwright inspected slide7 at1600×900
and1366×768: zoom1.000/0.945, no clipping, collisions or console errors. The full
render remains2/28 scaled with worst0.959/0.818 and no clipping. Raw render still
fails for the missing supplementary baseline and the same inherited contrast
instances; no baseline or unrelated file changed. Java and prompt source are
unchanged; no unit tests were rerun. The zero-byte placeholder is not ignored by
Git. Evidence and guarded-install backups: `/private/tmp/optional-agent-loading-20261028`.
