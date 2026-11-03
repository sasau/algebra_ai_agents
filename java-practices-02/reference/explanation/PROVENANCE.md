# Claude-authored Java illustrations

Revision 2026-11-03. Actual configured Claude Code CLI 2.1.287, Sonnet with low
effort, authored 37 native SVGs in separate requests, at most two calls at once.
Sixteen approved numbered execution figures are preserved; 21 new illustrations
introduce mechanism parts, waiting points, failure conditions and mitigations.
Claude received no filesystem, browser, MCP or delegation tools.

The new figures cover Thread, barrier/latch, synchronized, AtomicInteger,
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
