# Instructor validation — Java Practice02

Current wording revision, 2026-11-03: 74 slides, 41 SVGs, 120 tagged minutes.

## Beginner explanations

All slide titles, explanations, captions and limits were reviewed for students
new to threads. Task, caller, worker, monitor, atomicity, visibility, permits,
backpressure, checksum and starvation are explained in context. The start →
platform Thread.run → supplied task.run path is explicit; a direct run call,
join, termination, success, interruption and actual stopping are distinguished.
The worked diagrams and build/run commands remain in their existing order.

Four actual configured Claude requests proposed the wording. Local review fixed
semantic errors in those proposals and simplified labels in 38 figures. Exact
briefs/proposals, reviewed copy and local corrections accompany the kit.

## Validation for this revision

- Static gate PASS: 74 slides, 41 SVGs, 120 minutes; verify 34/34, lint 34/34,
  543 links across 36 files; code width, clarity, SVG and SVG-style checks clean.
- Playwright MCP reviewed all 74 slides at 1600×900 and 1366×768. The final
  edited preview was checked with fresh URLs after a cached older page was
  caught during screenshot comparison. Slides 45, 50 and 64 were rechecked
  after the final density refinements. No clipping, text outside SVGs,
  overlapping labels or page JavaScript errors. Screenshots were inspected.
- All 41 native SVGs have no overlapping/outside labels; declared text size
  is at least 18 units. The dining animation changes its position over its
  three-second cycle; its animation attributes are unchanged.
- Full render measurements and comparison with the preceding 74-slide deck
  find no zoom decrease beyond the existing 0.05 tolerance.

- 1600x900: 43 scaled slides, minimum zoom 0.785, no clipping.
- 1366x768: 49 scaled slides, minimum zoom 0.670, no clipping.

The raw render gate still FAILS because this supplementary deck has no baseline.
Both viewports report 83 contrast findings across four colour signatures, all
already found in course baselines. No new colour signature was introduced.
The template, shell exemplar and baseline hashes are unchanged; no rebaseline.

The HTML reference was checked at 1440px and 390px: 41 figures, nine sections,
no page overflow or missing anchors; all 41 figures scroll on phones. A long
builder expression uses the existing wrapping code style.

All 13 Java source/test/POM hashes and 20 classroom build/run code blocks match
the preceding reviewed revision. The retained Temurin 21.0.10 Maven evidence
from 2026-11-01 reports 16 passing narrated JUnit tests. This documentation-only
change did not rerun those tests or add runtime claims for illustrative failures.

Evidence: _kit/_work/java02/novice-20261103/ and
/private/tmp/course-java02-novice-20261103/. The slide digest is
13,610 bytes. The companion, figure index,
manifest, teaching plan, contract and ZIP are synchronized. Publishing checks
destination hashes first and byte-checks the archive against canonical files.
No commit or push was made.

---

## Historical validation — preceding revision

Current addition, 2026-11-03: 74 slides, 41 Claude-authored SVGs, 120 tagged minutes.

## New slides before the original slide 6

- Slide 6: Thread class/constructor declaration, task and name parameters, object
  creation, and the equivalent unstarted platform builder used in the reference.
- Slide 7: Runnable declaration, void run(), functional-interface meaning, lambda
  type/variable/parameters/arrow/body, and direct invocation versus worker execution.
- Slide 8: start(), run() and join() signatures and effects. The waiting caller,
  worker termination, void return and InterruptedException are distinguished.
- Slide 9: join(long millis), interrupt(), isAlive() and isInterrupted(). Positive
  timeout versus join(0), cooperative cancellation and state observations are explicit.
- Original slide 6 follows as slide 10. All 70 preceding slide bodies are retained
  apart from figure numbering; comparison by title finds no retained zoom reduction.

## Verification for this addition

Four actual Claude CLI 2.1.287 requests, Sonnet with low effort. Exact briefs,
reviewed SVGs, Java 21 API output and example-validation record are included in
reference/explanation. Local raw responses and original SVGs are retained at
/private/tmp/course-java02-creation-20261103/claude.

Signatures were checked with Temurin 21.0.10 javap -public. A standalone example
compiled with --release 21 -Xlint:all -Werror and executed both constructor and
builder creation forms. This is illustration verification, not a new JUnit run.
The 13 source/test/POM hashes are unchanged; the retained 16 passing narrated
Maven/JUnit tests and actual console evidence remain applicable and were not rerun.

Static gate PASS: 74 slides, 41 SVGs, 120 minutes; verify 34/34 decks, lint 34/34,
543 links across 36 files, code width clean. Clarity/SVG/SVG-style prechecks pass.
Frozen template, shell and render-baseline hashes are unchanged.

Playwright MCP reviewed slides 5–13 at 1600×900 and 1366×768 (18 page/viewport
combinations), including all four additions and their neighbours. Screenshots were
visually inspected; there was no clipping, outside figure text, label overlap or
JavaScript error. Four native SVG audits have no overlaps/outside/small labels;
all labels are at least 18 units. Full render measurements cover all 74 slides.

- 1600x900: 43 scaled slides; minimum zoom 0.794; no clipping.
- 1366x768: 47 scaled slides; minimum zoom 0.677; no clipping.

Raw render gate still FAILS: the supplementary deck has no baseline. Each viewport
reports 83 contrast fingerprints across four colour signatures, all present in
existing course baselines; no new signature was introduced and no baseline changed.
HTML checked at 1440px and 390px: 41 figures, nine sections, no page overflow or
missing anchors. All phone figures scroll horizontally. The builder expression
wraps in prose using the existing code style. The dining SVG and animation are
unchanged from the preceding reviewed revision.

Browser/native/HTML and slide-identity reports: _kit/_work/java02/creation-20261103/.
Raw render/gate/API/example evidence: /private/tmp/course-java02-creation-20261103/.
Digest: summaries/session-java02.md, 13,717 bytes. Source landing, HTML,
figure index, slide manifest, teaching plan, course indexes and ZIP are updated.
The ZIP is checked byte-for-byte against canonical files, excluding generated
workspace, target, measurements, .git and Python caches. No commit or push was made.

---

## Historical validation — preceding 70-slide / 37-figure revision

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
