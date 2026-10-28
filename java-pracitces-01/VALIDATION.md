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

## Optional API tour and persistent tutor comments — 2026-10-28

- Current deck:121 pages,31 teaching figures plus the institutional badge
  (32 SVGs),120 tagged minutes. Live1–73; guided follow-up74–121.
- Slides8–16 motivate Optional with missing-result failures, retain the original
  present/empty/zero diagram, then show the full class declaration and all20
  public method declarations. Exact generics/overloads match the Oracle Java21
  primary API and the actual rendered SVG text. The map adds no implementation task.
- Eight new native SVGs were authored through actual Claude Sonnet/medium CLI
  calls. Briefs, raw responses and provenance are retained. Local corrections
  clarify map-null versus flatMap-null, lazy fallbacks, hash collisions and spacing.
- Slide19 turns the former slide12 explanation point into the first specialist
  refinement. Students save useful comments/JavaDoc as a java-tutor policy, inspect
  the diff, then annotate the Maven shell with the separate existing prompt on20.
  The new companion prompt, inactive role example and walkthrough agree. Observation
  and expected comparison stay read-only; no active student role is preinstalled.
- Static gate:verify slides=121,SVG=32,agenda=120;verify/lint33 of33,487 hrefs
  across34 files,code-width PASS. SVG/style prechecks PASS. One inherited clarity
  warning on75 lists the seven follow-up cases, preserving their one-to-one map.
- Source checks preserve112 existing pages except marker/figure numbering and
  all62 existing copyable prompts. One new policy prompt gives63 copyable prompts
  and22 process-prompt files. All57 student Markdown relative links resolve.
- Actual Playwright MCP inspected all121 pages at1600×900 and1366×768
  (242 page/viewport combinations): no clipping, geometry warnings or console
  errors; badges load. New pages were inspected in full-size screenshots and
  contact sheets; slide19 was reviewed at both sizes.
- Render1600×900:9 scaled,worst0.940,no clipping. Render1366×768:
  36 scaled,worst0.802,no clipping. All112 preserved page identities retain
  their preceding113-page artifact's contrast findings. At1366 only page28
  (formerly20) has a zoom change:0.952 to0.923 after caption renumbering, within
  the0.05 gate tolerance; it was visually inspected. All other preserved zooms match.
- Raw render exits1 / RENDER GATE FAIL: this supplementary slug lacks a baseline
  and reports371 contrast instances per viewport in9 distinct tag/foreground/
  background signatures. All9 signatures match the preceding artifact and
  existing course baselines. No new signature was introduced and no baseline
  was reset.
- Hash guards preserve32 official decks, the render baseline and all remaining
  student implementation/fixture/skill/tool files, including the zero-byte agent
  directory placeholder. No Java implementation changed and no Java suite was rerun.
  Earlier reference validation remains10 mains/30 tests, live3 mains/9 tests;
  these are prior results, not new student execution evidence.

Evidence: `/private/tmp/optional-api-tour-20261028` (Claude raw provenance,
signature checks, browser screenshots/JSON, contrast comparison and guarded
installation plan/backups). Earlier Java execution:
`/private/tmp/optional-guided-dialogue-20261027`. No commit or push.

## First example: task, prompt, execution, comparison — 2026-10-28

Current deck:122 slides,32 teaching figures plus badge (33 SVGs),120 minutes.
Live1–74; guided follow-up75–122. Slide29 now states the name-handling demo
in simple language and shows the three methods, their example inputs and results,
plus the deliberate caught error. The native SVG was authored through an actual
Claude Sonnet/medium CLI call; its brief, raw response and provenance are retained.

Slide30 keeps the build prompt and explains the package, Optional<String> result
and launcher route.31 annotates,32 is the student run,33 is Claude observation.
Slide34 shows the complete unchanged expected/case01.txt before35 asks for
comparison. It defines a checking fixture and explains exact ordered RESULT rows,
allowed narration, exit0 and empty stderr. case01 is an exercise/route label;
program inputs are Java literals. The check skill is introduced later, so35
describes a manual Claude comparison. Repair remains a separate conditional step.
The case01 lesson and slide companion follow the same sequence.

Static gate PASS:slides=122,SVG=33,agenda=120;verify/lint33 of33,487 hrefs
across34 files,code width PASS. SVG/style prechecks PASS. Clarity flags the
inherited seven-case follow-up list and the literal NOT RUN execution status;
the latter is ordinary words rather than an undefined acronym.118 existing pages are preserved apart
from numbering, and all63 copyable student prompts remain unchanged. All five
case01 prompt blocks and the supplied four-line fixture are unchanged.

Actual Playwright MCP reviewed10 affected/adjacent pages at1600×900 and
1366×768 with no geometry warnings, clipping or console errors; all badges load.
Changed pages were inspected in screenshots. Full-deck render1600×900:
9 scaled,worst0.940,no clipping.1366×768:38 scaled,
worst0.802,no clipping. All118 preserved pages retain contrast findings
and remain within the0.05 zoom-regression tolerance compared with the preceding
121-page reviewed artifact. Detailed comparison is in contrast-comparison.json.

Raw render exits1 / RENDER GATE FAIL: the supplementary slug lacks a baseline.
It reports375/375 contrast instances at1600/1366 in
9/9 signatures; all occur in existing course baselines.
New signatures relative to the preceding artifact:0/0.
No new contrast signature is absent from course baselines; no baseline reset.

Java code, expected fixtures, agent/skill/tool files and all32 official decks
are hash-preserved. Java tests were not rerun for this teaching-only change;
prior reference validation remains10 mains/30 tests and live3 mains/9 tests.
Evidence and guarded-install backups: `/private/tmp/optional-case01-brief-20261028`.
No commit or push.
