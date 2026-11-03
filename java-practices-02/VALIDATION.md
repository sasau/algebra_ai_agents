# Instructor validation — Java Practice02

Current revision: 2026-11-03, graphical Java mechanism introductions and failures.

## Teaching coverage

70 slides, 37 Claude-authored native SVGs, one eating animation, 120 tagged minutes.
The 16 preceding execution traces are preserved. Twenty-one new graphics show
mechanism parts, protected regions, ownership, waiting conditions, failures and
mitigations. The sequence remains problem → mechanism → worked execution → short
copy/paste build/run → observed output. Extra failure panels support discussion
or follow-up within the same 120-minute core; no agent-workflow pages were added.

Covered: thread completion/nontermination; barrier/latch signals; monitor entry,
endless ownership and true circular deadlock; atomic operation boundaries and
check-then-act races; executor queues, overload and pool starvation; Future
outcomes and cooperative cancellation; virtual-thread carriers and pinning;
semaphore admission, permit leaks and extra releases; explicit lock ownership;
blocking queues and deadlock through an unrelated outer monitor.

New broken cases are explicitly conceptual diagrams, not additional runnable
unsafe code or tests. The original detailed lifecycle source walkthrough and
actual console excerpts remain in the HTML reference, now with all 37 diagrams.

## Java validation retained; source unchanged

Canonical module: /Users/auscumlic/Development/algebra/practices/java-practices-02.
All 13 checked source/test/POM SHA-256 hashes match the retained checked-source
manifest. No Java source, test or POM changed in this diagram/documentation work.
The retained 2026-11-01 clean Maven verification on Temurin 21.0.10 passed all
16 tests with zero failures/errors/skips. It was not rerun for this revision.
Actual console narration and assertions remain in reference/evidence.

The retained outcomes include worker/main lifecycle names, forced lost update 1,
protected counters 2000/2000, quote total 5400, FIFO A/B/C, five first forks then
stopped workers, and three ordered meals per philosopher. Timing checks require
equal work and thread types, without a speed threshold. The empty Maven bootstrap
still requires tests for a normal feature verification; setup alone is insufficient.

## Static, browser and render review

Static gate PASS: 70 slides, 37 SVGs, 120 minutes; verify 34/34 decks, lint 34/34,
539 links across 36 files, code width clean. Clarity, SVG and SVG-style prechecks
are clean. Frozen shell, template and render-baseline hashes remain unchanged.

Actual Playwright MCP inspected all 70 slides at 1600×900 and 1366×768 (140
page/viewport combinations), captured screenshots and checked figure labels.
All 21 new figure slides were visually reviewed in contact sheets at both sizes;
native SVGs were also reviewed. Native labels are at least 18 units, with no
out-of-viewBox labels or text overlaps.

- 1600×900: 39 scaled slides; minimum zoom 0.803; no clipping, outside labels, label overlaps or JavaScript errors.
- 1366×768: 43 scaled slides; minimum zoom 0.685; no clipping, outside labels, label overlaps or JavaScript errors.

Comparison by slide title retains all 48 preceding pages. Forty-seven have no
zoom reduction. The timing-experiment caption wraps after its longer figure
number: zoom 0.898→0.877 and 0.766→0.749; the rest of that slide is identical.
The new explanatory slides establish the current minimum zoom.

Raw render gate remains **FAIL** because this supplementary deck has no render
baseline. Each viewport reports 79 contrast fingerprints in four colour
signatures; all four occur in existing course baselines, with zero absent
signatures. No baseline was changed. Raw gate and measurement evidence is retained.

HTML checked at 1440px and 390px: 37 figures, nine sections, no page overflow or
missing local anchors. On the phone all 37 figures scroll horizontally.
JC2.33 on slide 55 retains one 3-second repeating spoon animation.
Multiple browser samples confirm movement and unchanged labels; previous/next
keyboard navigation passed. Global fork ordering prevents deadlock, not starvation.

## Provenance, evidence and distribution

- Actual configured Claude CLI authored all 37 SVGs; 21 new calls for this revision.
- Exact briefs and reviewed SVGs are included in reference/explanation; the slide
  map and local corrections preserve review history.
- Raw new Claude responses: /private/tmp/course-java02-anatomy-20261103/claude.
- Browser/native geometry, animation, HTML and preceding-slide comparison reports:
  _kit/_work/java02/anatomy-20261103/ in the course repository.
- Stable screenshots: /tmp/course-c-playwright/java02-anatomy-*.
- Raw render/gate evidence: /private/tmp/course-java02-anatomy-20261103.
- Canonical explanation/project.html and the course preview are byte-identical.
- ZIP is rebuilt from canonical source, excluding workspace, target, measurements,
  .git and Python caches. Every archived file is checked against canonical bytes.
- Digest: summaries/session-java02.md, 12,854 bytes; plan and indexes agree.

No commit or push was made. Unrelated working-tree changes were preserved.
