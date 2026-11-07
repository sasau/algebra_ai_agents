# Design and interfaces — classes to create, not supplied code

Package: `edu.algebra.http`. Artifact: `edu.algebra:java-03-http-server:1.0-SNAPSHOT`.
Build a dependency-free executable JAR, `target/java-03-http-server.jar`, with
main class `edu.algebra.http.App`. JUnit is test scope only. Use Java 21 without
preview. Suggested pinned Maven versions: compiler 3.13.0, surefire 3.5.3,
jar 3.4.2 and JUnit Jupiter 5.12.2. Other versions require actual verification
and a log entry; never silently switch the JDK or skip tests.

## Stable seams for separate builders

- `ServerConfig`: immutable configuration with port, absolute session TTL,
  session capacity and maximum in-flight application requests. Defaults: 8080,
  30 minutes, 1000 and 32. Accept CLI `--port N` (0 for test-assigned port,
  otherwise 1–65535); `--help` prints usage and exits 0; invalid arguments exit 2.
- `App`: CLI, server startup and shutdown hook. Print the actual bound loopback
  address. Do not block the shutdown hook on an unbounded join.
- `ServerApp`: `start(ServerConfig)` and a test seam accepting an injected
  `Clock` and handler/delegate as needed. Expose actual `port()` and idempotent
  `close()`. Implement `AutoCloseable`. Tests bind port 0 and close in finally
  or try-with-resources. A production server binds only 127.0.0.1.
- `Router implements HttpHandler`: one exact-path dispatch point. Shared
  response-writing helper `Responses` encodes UTF-8, handles no-body statuses
  and closes exchanges. `GreetingHandler`, `EchoHandler`, `SessionHandler`
  may be separate small handlers; equivalent names must be agreed before editing.
- `SessionStore(Clock clock, Duration ttl, int capacity)`: implement
  `visit(String candidateId)` returning an immutable `(id, visits, created)`
  result, `invalidate(String id)` and `size()` for assertions. Null means no
  usable cookie. Use a named `SessionCapacityException` for failed creation.
  Tests inject a mutable/fixed clock; production uses `Clock.systemUTC()`.
- `AdmissionHandler implements HttpHandler`: wraps a delegate with a
  `Semaphore`; `tryAcquire()` rejects immediately with 503 when full. Release
  exactly once in finally, including delegate failures. It limits admitted
  application work, not all sockets or virtual-thread creation.
- `LoadProbe`: a standalone main class using `java.net.http.HttpClient` and a
  fixed-size client executor. Parameters: origin, request count, concurrency.
  It checks health response status and body and returns a nonzero process exit
  if any request fails or arguments are invalid.

Use the JDK's `HttpServer`, `HttpExchange`, `HttpClient`, `Clock`, `Semaphore`
and `Executors.newVirtualThreadPerTaskExecutor()`. In Steps 02–06 a single
owned platform-thread executor is sufficient; Step 07 replaces it explicitly.
Server.close stops accepting requests, uses `HttpServer.stop(1)` for a bounded
grace period, shuts down its executor, waits at most two seconds, then interrupts
remaining tasks. Propagate interruption appropriately. Port reuse and worker
termination are verified rather than assumed.

## Shared-state correctness before optimization

A single short synchronized store operation is acceptable for this small
in-memory workload. Under that lock, purge expired sessions, resolve or create
an ID, increment visits and return an immutable result. Deletion uses the same
lock. Keep HTTP I/O, test latches, response writing and other blocking work
outside the store lock. A ConcurrentHashMap alone does not make lookup + expiry
+ creation + increment atomic. Alternative implementations need equivalent
behavioral evidence, including capacity under concurrent creation.

For 200 successful concurrent visits using one pre-created cookie, returned
counts must be the unique set 2..201. A final inspection visit returns 202.
Do not send cookie-less concurrent requests and call the resulting distinct
sessions a session-counter test. Shared test clients must either send a fixed
Cookie header or use a safely configured CookieManager.

## Measured limits

Virtual threads let waiting request handlers overlap; they do not eliminate
shared-state races or create processor capacity. A semaphore caps application
work at 32 by default and returns 503 under deliberate overload. It does not
provide a full internet-facing connection, memory or slow-client limit. The
classroom service accepts local trusted clients; production hardening is outside
the exercise. Performance is measured separately from correctness.

Primary references: [HttpServer](https://docs.oracle.com/en/java/javase/21/docs/api/jdk.httpserver/com/sun/net/httpserver/HttpServer.html),
[HttpExchange](https://docs.oracle.com/en/java/javase/21/docs/api/jdk.httpserver/com/sun/net/httpserver/HttpExchange.html),
[virtual threads](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html),
[Semaphore](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/Semaphore.html),
[Clock](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/time/Clock.html),
[HTTP cookie semantics](https://www.rfc-editor.org/rfc/rfc6265).
