# Build plan — Java 03 HTTP server

## Goal and boundaries

Build a small, runnable HTTP service from scratch while keeping agent work
inspectable and resumable. JDK 21 HttpServer supplies protocol parsing and
connections. Student code supplies exact routing, text responses, a bounded echo
body, cookie sessions, atomic visit counting, expiry, admission control, orderly
shutdown and a load probe. Use Maven and JUnit 5. No framework, database, TLS,
authentication, hand-written HTTP parser or preview APIs. Listen on
`127.0.0.1` by default. In-memory sessions disappear on process restart.

## Finished behavior

See [HTTP contract](contracts/http.md) for exact endpoints and
[design contract](contracts/design.md) for interfaces and concurrency semantics.
One shared cookie identifies a visit-counter session. A fresh request creates
one, repeat requests increment it, expiry or DELETE ends it. Multiple clients
must overlap safely. The target is 200 correct health responses with 10
concurrent clients and measured throughput of at least 10 requests/second on a
normal local classroom machine. Record a slower result and diagnose it instead
of inventing success or silently weakening the target.

## Dependency chain

| Step | Build one part | Independent verification | Local commit |
|---|---|---|---|
| [01](steps/01-bootstrap.md) | Create repository, Maven, CLI configuration | CLI defaults/errors, actual JAR help | `step-01: bootstrap Maven project` |
| [02](steps/02-lifecycle.md) | Start/stop HttpServer and health route | Loopback request, port 0, cleanup | `step-02: add HTTP lifecycle and health` |
| [03](steps/03-routing.md) | Route exactly and process hello input | Methods, paths, decoding, UTF-8 | `step-03: add exact routing and greeting` |
| [04](steps/04-echo.md) | Bound and echo request bodies | 0/4096/4097 bytes, stream input | `step-04: add bounded echo processing` |
| [05](steps/05-session-store.md) | Add testable concurrent session store | Clock-driven expiry, capacity, exact counts | `step-05: add concurrent session store` |
| [06](steps/06-session-http.md) | Connect cookies to session endpoints | New/reused/expired/deleted/unknown cookies | `step-06: connect cookie session endpoints` |
| [07](steps/07-concurrency.md) | Add virtual workers and admission permits | Proven overlap, atomic visits, 503/recovery | `step-07: bound concurrent request work` |
| [08](steps/08-resilience.md) | Contain errors and finish lifecycle cleanup | Injected failure, leaked permits, shutdown | `step-08: harden errors and shutdown` |
| [09](steps/09-load.md) | Build and run a bounded load probe | Real packaged JAR, 200 responses, observed rate | `step-09: measure concurrent HTTP requests` |
| [10](steps/10-handoff.md) | Finish documentation and acceptance audit | Fresh checkout, all gates, recovery rehearsal | `step-10: document and verify final server` |

Dependencies are sequential: only start NN after every earlier step has a
verified local commit. Steps 05 and 06 deliberately separate state mechanics
from HTTP integration; Step 07 checks the resulting shared state under actual
overlapping requests. A test-builder may propose a failing test before a builder
repairs code, but there is only one writing worker at a time.

## Execution and acceptance

The main session is the orchestrator. `java-builder` implements the scoped
feature, `test-builder` implements its behavioral tests, and `verifier` checks
the result independently. They receive the active step and relevant interfaces,
not the entire conversation. See [checkpoint protocol](workflow/checkpoints.md).
`log.md` is the durable progress index; evidence files contain the actual output;
Git contains accepted changes. Each has a different purpose.

Default stop: after Step 01. The student can request any later stop point, stop
at the next boundary, or interrupt immediately. See [recovery](workflow/recovery.md).
Never mark a pending, failed or partially verified step complete. Do not spend
later steps' scope while repairing the current one. If an interface contract
needs a real change, explain it in log.md before making a minimal coordinated
revision; never silently change acceptance criteria to match current code.
