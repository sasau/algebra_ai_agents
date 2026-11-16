# Next Java practice — build our own HTTP transport

Planning draft, 2026-11-07. Proposed practice: **Java04 — Build the HTTP
transport beneath our application**, in `java-practices-04`.

Extend the completed [Java03 application](README.md) by replacing
JDK `HttpServer` with a small HTTP/1.1 transport implemented by students.
Keep the existing routes, cookie sessions and observable application behavior.
Students learn what the JDK currently does between a TCP connection and a
handler invocation.

## What changes

Use Java 21, Maven, JUnit, `ServerSocket`, socket streams and virtual threads.
Students implement the HTTP accept loop, parsing, message framing, response
writing and connection lifecycle. Java still supplies TCP networking and thread
scheduling. The JDK HTTP client can remain in the tests and load probe.

| Responsibility | Java03 | Follow-up |
|---|---|---|
| Accept TCP connections | JDK `HttpServer` | Our accept loop and connection tasks |
| Parse method, request target and headers | JDK | Our bounded request parser |
| Determine where the body ends | JDK | Our framing rules and body reader |
| Write HTTP status, headers and body | JDK | Our response writer |
| Routes, cookies and session state | Our application | Reuse behind transport-independent interfaces |
| Close connections and stop workers | Shared with JDK | Our explicit lifecycle management |

The main new difficulty is that **TCP is a stream of bytes**. One read may
contain only part of a header, and a body may arrive later. Tests must expose
partial reads, incomplete requests, malformed framing and stalled clients.

## Scope and compatibility

Start with one request per connection, send `Connection: close`, and support
request bodies framed by `Content-Length`. Explicitly reject unsupported
transfer encodings before routing in this intermediate version. Bound request
lines, headers and bodies; do not read arbitrary input into memory.

The final core build must also decode chunked request bodies: Java03 already
promises bounded echo for chunked input. Until that checkpoint passes, the
custom transport is an intermediate subset and cannot claim full Java03
application compatibility. Conflicting or ambiguous framing, including
`Transfer-Encoding` combined with `Content-Length`, must be rejected under
explicit contract rules.

Preserve the existing route responses, UTF-8 byte lengths, binary echo limit,
HEAD/bodyless-response rules, cookie behavior, session expiry and atomic visit
updates. Retain the JDK-backed version for comparison through the same external
application tests. JDK-specific injection seams and transport tests will need
adaptation.

Persistent connections are an optional extension. TLS, HTTP/2, HTTP/3,
compression, WebSockets and production deployment are outside the core build.
Describe the result as an educational HTTP/1.1 subset with documented limits.

## Build checkpoints

Each checkpoint pairs one implementation increment with verification and an
accepted local commit.

| Step | Implementation increment | Verification before acceptance |
|---|---|---|
| 01 — Separate application and transport | Introduce our own `Request`, `Response` and handler interface; adapt the current JDK transport. Keep session-store logic unchanged. | Existing external application checks still pass through the JDK adapter; application handlers no longer depend on `HttpExchange`. |
| 02 — Accept connections | Bind a loopback `ServerSocket`, accept connections on virtual-thread tasks, and own listener/socket cleanup. | Port 0 works in tests; multiple connections can overlap; closing the server stops acceptance and releases the port. |
| 03 — Parse request metadata | Parse the request line and headers with explicit size limits and case-insensitive header lookup that preserves repeated values. | Valid requests parse; fragmented lines and headers work; malformed syntax, premature EOF and oversized metadata are rejected without reaching application handlers. |
| 04 — Read fixed-length bodies | Validate `Content-Length` and read exactly the declared bytes, subject to the application limit. | Binary and fragmented bodies work; invalid/conflicting lengths, incomplete bodies and oversized echo input follow the contract. |
| 05 — Write responses | Encode the status line, headers, CRLF separator and body; send `Connection: close`. | Raw socket checks confirm exact bytes, UTF-8 byte counts, header serialization and HEAD/204 body suppression. |
| 06 — Reconnect the application | Connect the router, response helpers, cookies and existing session store to the custom transport. | Shared application tests pass for supported framing; compare statuses, headers and bodies against the JDK version, including session creation, reuse, deletion and concurrency. |
| 07 — Bound work and recover | Add read deadlines, connection limits, application admission, error handling and bounded shutdown. Close active sockets when needed to unblock reads. | Stalled clients do not prevent unrelated requests; overload follows a defined policy; failures release owned permits and sockets; shutdown and restart complete within bounds. |
| 08 — Complete framing and measure | Add bounded chunked decoding, including chunk syntax and trailer handling rules. Run the complete compatibility suite, manual console checks and packaged load probe. | Chunked binary echo and size limits pass; malformed/ambiguous framing is rejected; all required Java03 application behavior passes; record actual successes, failures and rate. |

Early connection and parser checkpoints use raw socket fixtures before the
complete application path exists. Reuse Java03's manual macOS and Windows
checks once routing is connected. Keep correctness and measured throughput as
separate acceptance evidence; do not assume the custom transport is faster.

## Transport contract to prepare

Add `contracts/transport.md` when preparing the actual starter. It must define:

- Accepted HTTP version, request-target forms, line endings and header syntax.
- Limits for request lines, individual headers, total headers and body bytes.
- Body-framing rules, duplicate lengths, chunk syntax and trailer handling.
- Missing or invalid `Host`, unsupported `Expect` behavior and protocol errors.
- Exact error responses where a response can be sent, followed by connection closure.
- Read deadlines, maximum active connections and overload behavior.
- Response framing, body suppression and shutdown ownership.

Connection admission and application admission protect different resources.
A socket can consume resources before a complete request reaches the existing
application semaphore. Specify and test both boundaries separately.

## Claude Code workflow and teaching order

Reuse Java03's main orchestrator, implementation/test/verifier roles, bounded
worker tasks, verification evidence, `log.md`, stop/resume prompts and one local
commit per accepted step. The follow-up starts from a completed Java03 project;
students implement the new transport themselves with that workflow.

Teach the existing JDK boundary first, then trace raw request bytes through
accept → parse → frame body → route → serialize response → close. Demonstrate
fragmented input before introducing the parser, and show malformed/slow input
before adding limits and recovery. Explain connection ownership separately
from shared-session correctness.

Prepare a new plan, eight detailed step files, a pending progress log, transport
contract and kickoff prompt when this practice is developed. Keep the completed
reference separate from the student starter. This file records the proposed
scope; it does not create those deliverables or change Java03.

Use checkpoint-paced teaching with continuation after class. Do not promise
that the full protocol build fits a single 120-minute session.
