# Claude-authored Java illustrations

Revision 2026-11-03. Actual configured Claude Code CLI 2.1.287, Sonnet with low
effort, authored 41 native SVGs in separate requests, at most two calls at once.
Sixteen execution figures and 21 mechanism/failure diagrams are preserved. Four
new diagrams introduce Thread/Runnable declarations, creation and method contracts.
Claude received no filesystem, browser, MCP or delegation tools.

The mechanism/failure figures cover Thread, barrier/latch, synchronized, AtomicInteger,
ExecutorService, Future/cancellation, virtual threads, Semaphore, ReentrantLock
and BlockingQueue. Local review checked ownership, Java thread states, queue
contents, counters, exceptional outcomes and version-specific pinning behavior.
An endless monitor owner is distinguished from a circular deadlock; cancelled
Future state is distinguished from worker termination. Fixed-pool workers do not
bound the backlog. The ready virtual thread waits for a free carrier.

Reviewed editable SVGs: figures/. Exact briefs: provenance/briefs/.
Slide map and semantic/geometry corrections: provenance/*.json.
Original unmodified SVGs, structured responses and stderr are retained locally:
/private/tmp/course-java02-numbered-20261103/claude (16 execution figures)
/private/tmp/course-java02-anatomy-20261103/claude (21 mechanism/failure figures).
The original Claude-authored lifecycle explanation and source walkthrough remain.

One 3-second repeating SMIL animation illustrates eating at the labelled dining
step. Text and fork ownership stay static; this is not live Java state. Source,
tests, POM and retained narrated assertion evidence remain unchanged.


## Thread/Runnable API addition

Four actual configured Claude CLI requests authored thread-create, runnable-create,
thread-methods and thread-wait-cancel. Exact briefs are included; originals, raw
responses and stderr are retained at /private/tmp/course-java02-creation-20261103/claude.
The Java 21 public API dump and standalone example result are in provenance/.
The temporary example source remains in that same local evidence directory.
The previous 70 slide bodies are preserved apart from figure numbering; four
slides are inserted before the former slide 6. No new implementation or JUnit
claims are implied by the API illustrations.


## Beginner wording review — 2026-11-03

Four actual configured Claude CLI requests (Sonnet, low effort) proposed wording
for all 74 slides. Exact briefs, proposals and the locally reviewed final copy
are in provenance/. Raw responses and stderr remain in
/private/tmp/course-java02-novice-20261103/claude.
Local review corrected API meaning and revised labels in 38 of the 41 existing
SVGs without redrawing them. The dining animation has identical attributes and
was checked at two animation times in the browser. No Java implementation,
JUnit assertion, POM or recorded execution result changed.
