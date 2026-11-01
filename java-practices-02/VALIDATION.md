# Instructor validation — Java Practice02

Current revision: 2026-11-01, Java-feature-first teaching.

## Java problem → solution → build/run → result

The deck has 43 slides and 11 native SVG figures. Specialist-workflow teaching
pages and prompt-by-prompt walkthroughs are removed. Lifecycle first establishes
the desired result and missing-completion problem, then illustrates start/join
and direct run. One short build-and-run page follows, then observed output and
the named Java mechanisms. Other features follow the same structure.
Nine classroom specifications keep implementation requirements in the repository;
the long granular conversations and detailed HTML remain optional reference.

## Java validation retained without source changes

Canonical source: /Users/auscumlic/Development/algebra/practices/java-practices-02.
Source/POM hashes match reference/evidence/checked-source-sha256.json exactly.
No Java implementation, test or POM changed in this teaching revision.
The recorded clean build `mvn -o -B clean verify` passed on Temurin 21.0.10,
Maven 3.10.0: 16 tests, zero failures/errors/skips, exit0.
Five classes contain 1 lifecycle, 3 shared-state, 5 orchestration, 4 comparison
and 3 dining tests. Detailed narration and actual JUnit assertions are preserved.

Actual recorded CLI runs all exited 0 with empty stderr: lifecycle names
lesson-worker/main; forced race 1 and protected counts 2000/2000; quotes 5400 and
FIFO A/B/C; five first forks followed by stopped workers; ordered meals 3 each.
The comparison ran 120 equal tasks with 20ms simulated waits, 3 warmups and 5 measured
rounds, rotating mode order. Counts/checksums match within each workload and only
virtual mode reports 120 virtual tasks. The deck labels its medians as actual
instructor observations, never a universal ranking or required speedup.

Earlier bootstrap checks remain valid: empty project; nonempty-target refusal
with unchanged hashes; malformed package rejected before writing. Zero-test
normal verify and missing-focused-class verify deliberately failed. Setup-only
-DskipTests package succeeded with tests skipped and does not validate a feature.
Actual full logs and machine-readable results remain in reference/evidence.

## Static, browser and render checks

Static gate PASS: 43 slides, 11 SVGs, 120 tagged minutes; verify 34/34 decks,
lint 34/34, 498 links across 36 files, code width clean. Clarity, SVG and SVG-style
prechecks are clean. No frozen shell or render baseline was changed.

Actual Playwright MCP inspected all 43 pages at 1600×900 and 1366×768 (86 page/viewport
combinations), with stable screenshots at both sizes. No clipping, SVG text
outside its viewBox or page JavaScript errors were observed. Updated action
pages were inspected again after their copy was shortened.

- 1600x900: 12 scaled pages, worst zoom 0.843, no clipping; 52 inherited contrast fingerprints in 4 course signatures.
- 1366x768: 16 scaled pages, worst zoom 0.720, no clipping; 52 inherited contrast fingerprints in 4 course signatures.

Raw render gate remains **FAIL** because the supplementary deck has no baseline.
Every reported colour signature occurs in existing course baselines; zero
signatures are absent. Raw results are retained, not hidden by rebaselining.
Retained figure pages were compared by mechanism after renumbering; the virtual
thread and queue pages retain their prior minimum zoom. The earlier lifecycle
diagram is replaced by separately illustrated problem and solution pages.

The optional HTML reference was inspected at 1440px and 390px. It has no page
overflow; diagrams scroll horizontally on narrow screens to preserve label size.
Its opening explains the desired Java result and completion boundary, followed
by source annotations and actual assertions. It no longer teaches agent handoffs.

## Claude figures and eating animation

Four new actual Claude CLI/Sonnet-low calls generated Java-problems overview,
lifecycle problem, lifecycle solution and task outcomes. Seven previously
Claude-authored Java figures are preserved. Native SVG briefs/raw responses are
in /private/tmp/course-java02-feature-first-20261101/claude. Local review fixed
arrow routes, label collisions, contrast and exact failure/cancellation wording.

Figure JC2.10 on slide 32 preserves the eating spoon animation: one animateTransform,
duration 3s, repeat indefinitely, readable static fork ownership. Pi requires Fi
and F(i+1)%5. Browser sampling confirms spoon movement while ownership labels stay
fixed. It illustrates a valid state, not the live Java process. Finite dining
tests do not prove starvation freedom or scheduler fairness.

## Artifact evidence

- Canonical classroom/ contains the copy-and-run feature specifications.
- Canonical reference/evidence/ retains actual Java execution logs and hashes.
- Canonical reference/explanation/project.html matches the course HTML preview.
- Browser details: _kit/_work/java02/feature-first/browser-verified.json.
- Stable screenshots: /tmp/course-c-playwright/java02-feature-*.
- Raw render evidence: /private/tmp/course-java02-feature-first-20261101.
- Portable ZIP is regenerated from canonical source, excluding workspace, target,
  measurements and Python caches. All archived file bytes match source.

No commit or push was made. Unrelated working-tree changes are preserved.
