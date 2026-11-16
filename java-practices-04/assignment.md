# Assignment — design the build, then replace the transport

The starting service already works. The exercise has two deliverables:
a plan that another agent can execute one verified step at a time, and the
working HTTP transport built by following that plan. The plan is assessed
before implementation begins.

## 1. Inspect the starting point

Trace a request from `ServerApp` through admission, the error boundary,
`Router`, a handler and `Responses`. Identify where `HttpServer`,
`HttpExchange` and `HttpHandler` connect the application to JDK transport.
Read `SessionStore` and its tests so transport work preserves its behavior.
Run the existing suite and record what actually passed.

Read [the scope draft](plans/next-practice.md). It contains a possible
sequence, not a required execution plan. Read [Java 03's plan](plans/java03-reference/plan.md)
for the shape of a bounded task and a verified checkpoint. Its instruction
to build a server from an empty folder does not apply to this starter.

## 2. Write your own orchestration plan

Create `plan.md` and a detailed `steps/` file for every proposed checkpoint.
Choose the number and order of steps yourself. Explain dependencies and
identify the first small, independently verifiable result. For every step
specify the goal, allowed files, agreed interfaces, worker role, focused
tests, full regression gate, manual observations, evidence path, repair
boundary, commit message and stop/resume action.

Define `contracts/transport.md` before assigning parser or writer work.
Make decisions explicit: HTTP version and target forms; CRLF and header
syntax; request-line, individual-header, total-header-byte/count and body
limits; repeated Content-Length values;
Transfer-Encoding plus Content-Length; chunk sizes, endings and trailers;
Host and Expect; exact errors where a response can be sent; read deadlines;
connection and application admission; response byte lengths; HEAD/204 body
suppression; and socket, worker and shutdown ownership.

Agree transport-independent request, response and handler interfaces in
`contracts/design.md`. Keep the existing application behavior traceable to
[the Java 03 HTTP contract](plans/java03-reference/contracts/http.md).
Explain which tests can be shared across both transports, which JDK-specific
injection tests need new seams, and how you will retain equivalent assertions.

Include who dispatches and accepts work, when a worker may write files,
what it receives, what it returns, and what happens after failure or context
loss. Choose models by task difficulty and verification needs; record the
models actually available in your harness. Bound each task's context and
repair attempts. State when to stop or request help. Record token usage or
cost only if the harness exposes it; otherwise label it unavailable.

Populate `log.md` with your pending steps and the next action. Do not mark
implementation steps complete because the plan exists. Stop for student
review of the plan before changing production code, tests or the POM.

## 3. Build and verify through your plan

Use Java 21, Maven, JUnit, `ServerSocket`, socket streams and virtual threads.
Start with one request per connection and close it after the response.
Preserve the JDK-backed implementation for comparison. A single TCP read
need not contain a whole line, header or body: prove correct handling with
raw socket tests that deliberately split input and finish or interrupt it.

Verify malformed and conflicting framing, premature EOF, oversized data,
stalled clients, overload, failure cleanup, bounded shutdown and restart.
Session concurrency must prove exact shared-cookie counts rather than infer
correctness from throughput. Verify UTF-8 byte lengths, binary echo through
4096 bytes and rejection at 4097, cookie behavior, expiry and body suppression.
Final compatibility requires chunked bodies; document any temporary subset.

Use the supplied sequential builder, test-builder and verifier roles. The
orchestrator owns acceptance, log and local commits. Every accepted step
needs actual focused checks plus `mvn -B verify`, nonzero tests, zero skips,
retained outputs and a hash manifest of the tested source. Preserve failed
attempts. No test weakening, push, or invented success.

At handoff, show both transports passing the shared application contract,
protocol and resource-limit tests for your transport, packaged run commands,
a measured 200-request/10-client load result, and stop/resume evidence.
Report correctness and measured speed separately; do not assume the custom
transport will be faster. Document the educational subset and its limits.
