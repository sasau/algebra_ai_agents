# Java 03 server: run and inspect

This is the completed instructor implementation of the [HTTP contract](../../contracts/http.md)
and [design contract](../../contracts/design.md). The application has no runtime
dependencies beyond JDK 21. JUnit is test scope only; Maven creates one executable
JAR. Agents authored and reviewed files during the exercise. They never run in
the HTTP request path, and the server makes no LLM calls.

## Build and launch

Run from the project root with JDK 21 and Maven 3.9+. Both `java -version` and
`mvn -version` must report Java 21; configure `JAVA_HOME` and `PATH` for your
installed JDK if needed. No preview features, framework or database are used.
The compiler, Surefire, JAR plugin and JUnit versions are pinned in [pom.xml](../pom.xml).
A first build needs Maven Central access or a populated Maven cache.

```bash
java -version
mvn -version
mvn -B verify
java -jar target/java-03-http-server.jar --help
java -jar target/java-03-http-server.jar --port 8080
```

The process prints `Listening on http://127.0.0.1:8080`. The bind address is
always IPv4 loopback. `--port 0` asks the OS for an available port; read the
actual printed port and use it in subsequent commands. A busy requested port
fails startup rather than connecting to another process. Help exits 0 without
binding a socket; invalid arguments exit 2; startup failure exits 1.

[ServerConfig](../src/main/java/edu/algebra/http/ServerConfig.java) is immutable:

| Setting | Default | How to change it |
|---|---|---|
| Port | 8080 | CLI `--port N`, integer 0..65535 |
| Absolute session TTL | 30 minutes | Construct ServerConfig in Java |
| Active session capacity | 1000 | Construct ServerConfig in Java |
| Admitted application requests | 32 | Construct ServerConfig in Java |

Only `--port N` and standalone `--help` are CLI options. Missing, unknown,
repeated or invalid arguments fail. TTL and both capacities must be positive.
Tests use port 0 and injectable clocks/delegates through
[ServerApp](../src/main/java/edu/algebra/http/ServerApp.java), without test endpoints.

## Follow one request

[App](../src/main/java/edu/algebra/http/App.java) parses arguments, starts
ServerApp, prints the actual address and installs a shutdown hook. JDK HttpServer
parses HTTP and owns connections. One root context delegates through
[AdmissionHandler](../src/main/java/edu/algebra/http/AdmissionHandler.java), then
[ErrorBoundary](../src/main/java/edu/algebra/http/ErrorBoundary.java), then
[Router](../src/main/java/edu/algebra/http/Router.java). Routing compares the
complete decoded `getRequestURI().getPath()`; JDK context-prefix matching is
insufficient. [Responses](../src/main/java/edu/algebra/http/Responses.java)
encodes text as UTF-8, calculates lengths from bytes and closes bodies/exchanges.

| Request | Successful result | Relevant errors |
|---|---|---|
| `GET /health` | 200, `OK\n` | Other methods: 405, Allow: GET |
| `GET /hello` | 200, `Hello, world!\n` | Invalid name/query decoding: 400 |
| `GET /hello?name=Ada` | 200, `Hello, Ada!\n` | Other methods: 405, Allow: GET |
| `POST /echo` | 200, exactly the input bytes | Byte 4097: 413; other methods: 405, Allow: POST |
| `GET /session` | 200, `visits=N\n` | New session at capacity: 503 |
| `DELETE /session` | 204, empty body; always clears cookie | Other methods: 405, Allow: GET, DELETE |

Here `\n` means one LF byte. Session GET and DELETE share Allow: GET, DELETE.
All text responses use `text/plain; charset=utf-8`; echo success uses
`application/octet-stream`. Unknown paths, including `/health/extra`, are 404.
HEAD has no supplied route: it returns the corresponding 404/405 without a body.
Admission can reject any route with 503 when all application permits are held.

Fixed error bodies are `Bad request\n` (400), `Not found\n` (404),
`Method not allowed\n` (405), `Payload too large\n` (413), `Busy\n` (503),
`Session capacity reached\n` (503) and `Internal server error\n` (500).
Expected input errors retain their status. An unexpected RuntimeException before
headers clears partial response headers and returns the fixed 500. After headers
start, the boundary closes the exchange; it cannot replace a status already sent.
No exception details or session IDs are placed in error bodies.

[GreetingHandler](../src/main/java/edu/algebra/http/GreetingHandler.java) decodes
percent escapes and `+` as space with strict UTF-8. An absent name means world;
blank, duplicate or over-80-Unicode-code-point names fail with 400. Other
well-formed parameters are ignored, but their decoding is still validated.
The JDK may reject malformed raw URIs before application routing.

[EchoHandler](../src/main/java/edu/algebra/http/EchoHandler.java) reads at most
4097 bytes regardless of Content-Length. It returns 0..4096 bytes unchanged,
including arbitrary binary data; the first excess byte yields 413. It never
collects the rest of an oversized stream into application memory.

```bash
curl -i http://127.0.0.1:8080/health
curl -i 'http://127.0.0.1:8080/hello?name=Ana+Maria'
curl -i 'http://127.0.0.1:8080/hello?name=%C5%BDeljka'
curl -i -X POST --data-binary 'hello' http://127.0.0.1:8080/echo
curl -i http://127.0.0.1:8080/health/extra
```

## Follow one session and one concurrent update

[SessionHandler](../src/main/java/edu/algebra/http/SessionHandler.java) reads
semicolon-separated pairs across every Cookie header, matching `J03SID` exactly.
Malformed or duplicate matching pairs are unusable. IDs are exactly 22 characters
from the base64url alphabet `A-Z a-z 0-9 _ -`: the server generates 16 random
bytes (128 bits) with SecureRandom and encodes without padding. Client-supplied
IDs are lookup candidates only. Missing, forged, expired or deleted candidates
are replaced with a fresh generated ID, never inserted as supplied keys.

Creation sends `J03SID=<id>; Path=/; HttpOnly; SameSite=Lax`. Reuse sends no
Set-Cookie. DELETE always sends
`J03SID=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`, even for missing/unknown
cookies, and allocates nothing. Health, hello and echo do not access sessions.
Secure is omitted for this HTTP loopback exercise.

Use a fresh cookie jar filename so the first request has no prior session:

```bash
curl -i -c cookies.txt http://127.0.0.1:8080/session
curl -i -b cookies.txt -c cookies.txt http://127.0.0.1:8080/session
curl -i -b cookies.txt -c cookies.txt -X DELETE http://127.0.0.1:8080/session
curl -i -b cookies.txt -c cookies.txt http://127.0.0.1:8080/session
```

Observe `visits=1`, then `visits=2`, empty 204 with the clearing cookie, then a
new `visits=1` with a different ID. `cookies.txt` is ignored runtime state. Tests
also explicitly replay a deleted ID and require a different replacement.

[SessionStore](../src/main/java/edu/algebra/http/SessionStore.java) applies
absolute expiry at creation plus TTL: `now >= expiresAt` is expired. Visits do
not extend it. A single short synchronized operation purges expired entries,
looks up or creates, enforces capacity and increments the counter. Invalidation
uses the same monitor. Existing live sessions still increment when capacity is
full. Random generation and all HTTP I/O stay outside the monitor.

This ordering means a visit before DELETE may finish; a visit after DELETE
cannot revive its ID. Immutable visit results can safely leave the monitor.
The concurrent tests seed one cookie, use that exact ID for 200 visits and
require the unique set 2..201 followed by 202. Separate clients remain isolated.

Virtual request threads allow waiting handlers to overlap. The store monitor
protects shared state. Semaphore `tryAcquire()` limits admitted work to 32 by
default and rejects immediately with Busy when full; an acquired permit is
released once in finally, including failures. This cap does not cap sockets or
virtual-thread creation. Latch-based tests prove overlap and cap/recovery
without using speed as evidence of concurrency.

## Stop and measure

Ctrl+C runs the shutdown hook. `close()` is idempotent: HttpServer.stop(1)
stops the listener with a one-second grace, the executor is shut down, termination
is awaited for at most two seconds, and remaining work is interrupted with
shutdownNow. Interruption is preserved. No unbounded join is used. Cooperative
handlers terminate after interruption; arbitrary Java code that ignores it
cannot be forcibly terminated by this service. Tests verify the released port
can be rebound and the owned cooperative tasks terminate.

[LoadProbe](../src/main/java/edu/algebra/http/LoadProbe.java) uses at most C
fixed client workers to send N GET /health requests. It counts only status 200
with exact UTF-8 bytes `OK\n` as success. Connect/request timeouts are three
seconds; the overall result-collection deadline is 60 seconds. Pending results
at that deadline count as failures and are canceled. Cleanup waits are bounded.
Invalid arguments exit 2; any failed request or interruption exits 1; all-correct
results exit 0. Origin must be an HTTP(S) origin without credentials, path beyond
`/`, query or fragment; count is positive and concurrency is in 1..count.

With the packaged server already running:

```bash
java -cp target/java-03-http-server.jar edu.algebra.http.LoadProbe http://127.0.0.1:8080 200 10
```

The original reference-build observation
on Apple M4 Max (16 logical CPUs), Darwin arm64, Temurin JDK 21.0.10, Maven 3.10.0:

```text
requests=200 concurrency=10 successes=200 failures=0 elapsed_seconds=0.100335 successful_requests_per_second=1993.328
```

Elapsed uses nanoTime from first submission through collected results, excluding
Maven, JVM/server startup and cleanup. This short local run exceeded the
classroom target of 10 successful requests/second with all 200 correct. It is
an observation on that machine, not a general throughput guarantee. The probe
uses concurrency below the server admission cap. Correctness tests have no
machine-speed threshold.

## Tests and verification evidence

Run `mvn -B verify` from the project root. Surefire requires nonzero tests.
Check XML under target/surefire-reports for zero failures, errors and skips;
compilation alone does not establish acceptance. See [validation](../VALIDATION.md)
for observed delivered-reference results and packaged-server checks.

| Behavior | Tests |
|---|---|
| CLI/defaults/errors | [AppTest](../src/test/java/edu/algebra/http/AppTest.java) |
| Startup, occupied port, close, rebind | [ServerLifecycleTest](../src/test/java/edu/algebra/http/ServerLifecycleTest.java) |
| Exact routes, query decoding, UTF-8 | [RoutingTest](../src/test/java/edu/algebra/http/RoutingTest.java) |
| Body bytes and bounded reading | [EchoTest](../src/test/java/edu/algebra/http/EchoTest.java) |
| Clock-driven expiry, capacity, atomic counts | [SessionStoreTest](../src/test/java/edu/algebra/http/SessionStoreTest.java) |
| Cookie lifecycle over real HTTP | [SessionHttpTest](../src/test/java/edu/algebra/http/SessionHttpTest.java) |
| Real overlap and shared-cookie visits | [ConcurrencyTest](../src/test/java/edu/algebra/http/ConcurrencyTest.java) |
| Saturation and permit recovery | [AdmissionTest](../src/test/java/edu/algebra/http/AdmissionTest.java) |
| Failure boundary and task cleanup | [ResilienceTest](../src/test/java/edu/algebra/http/ResilienceTest.java) |
| Probe correctness and deadlines | [LoadProbeTest](../src/test/java/edu/algebra/http/LoadProbeTest.java) |

## Limits

The service is a trusted local classroom demonstration: no TLS, authentication,
database or persistence. A session counter is not a person's identity. All
sessions disappear on restart, expiry cleanup runs on store operations, and
absolute expiry never slides. Loopback binding and admission do not establish
a complete internet-facing connection, memory or slow-client limit. The design
uses a short store monitor for correctness before optimization.
