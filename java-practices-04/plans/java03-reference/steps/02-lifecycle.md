# Step 02 — Start and stop a real health server

Dependency: 01. Begin only after earlier steps have verified local commits.
The interfaces and expected behavior in contracts/ are specifications to build.

## Build logic and verification cases

Create ServerApp (AutoCloseable), Responses and the initial health handler.
Bind JDK HttpServer to 127.0.0.1 and the configured port, supporting port 0 in
tests. Own a single-thread executor for now. Expose the actual bound port.
App starts the server, prints its actual address and installs a shutdown hook.
Implement idempotent close: stop server, shut down executor and bound every
wait. A failed startup must also release its created resources.

GET /health returns 200, UTF-8 text/plain, `OK\n`, and no Set-Cookie. Compute
length from UTF-8 bytes and close streams/exchanges. Exact routing and method
rules arrive in Step 03; do not add sessions or virtual workers early.

ServerLifecycleTest starts on port 0, performs a real HttpClient request with a
finite timeout, checks actual status/headers/body, calls close twice, and checks
the listener is no longer reachable. Rebind the released port in a fresh server
and close it. Bound all waits and close resources on failed assertions too.

Run the actual JAR on 8080, capture startup, curl -i /health, stop with Ctrl+C
(or a captured process termination), and prove the process exits and the port
is reusable. Record unexpected port collisions as environment failures; never
silently send checks to a different unrelated process.

## Ownership

- java-builder: the production classes required for this step under src/main/java/edu/algebra/http/.
- test-builder: src/test/java/edu/algebra/http/ for ServerLifecycleTest.
- verifier: new evidence/step-02/attempt-N/ files; no code or log edits.
- orchestrator: log.md, diff review, explicit staging and the local commit.

## Required gate and checkpoint

```bash
mvn -B -Dtest=ServerLifecycleTest verify
mvn -B verify
```

Require actual passing assertions, zero failures/errors, zero skipped tests and
the observations specified above. Record command exits and Surefire counts,
not only Maven's final banner. The full suite protects every earlier feature.
Save evidence and follow workflow/checkpoints.md. Intended commit message:

```text
step-02: add HTTP lifecycle and health
```

Stop on a failed gate, student interruption or the chosen STOP_AFTER boundary.
