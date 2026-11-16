# Step 08 — Contain handler failures and finish bounded shutdown

Dependency: 07. Begin only after earlier steps have verified local commits.
The interfaces and expected behavior in contracts/ are specifications to build.

## Build logic and verification cases

Add a central error boundary around application dispatch. Expected input errors
keep their specified status. An unexpected RuntimeException becomes a fixed
500 response if headers have not been sent, and always closes the exchange.
If a response has already started, close the connection; do not try to send
a second status line. Avoid exception traces and cookie IDs in client bodies.
Ensure admission permits are still released around the error boundary.

Complete bounded lifecycle cleanup: stop accepting with HttpServer.stop(1),
shutdown the owned executor, await at most two seconds, then shutdownNow and
preserve interruption. close is idempotent. Startup failure must not leak the
executor. Production handlers do not perform unbounded waits under store locks.

ResilienceTest injects a delegate that fails before headers: check 500, then
a successful request through the same admission wrapper. Test a post-header
failure as connection closure rather than a promised replacement body. Hold a
test request, close the server, and assert listener/owned tasks terminate within
the documented grace and timeout allowance. Test startup on an occupied port,
double close and port reuse. Never expose a production /crash endpoint.

Inspect source and test cleanup, then run every focused resilience/lifecycle
check and the regression suite. Preserve failure evidence before repairing a
leak. A green HTTP status without executor cleanup is insufficient acceptance.

## Ownership

- java-builder: the production classes required for this step under src/main/java/edu/algebra/http/.
- test-builder: src/test/java/edu/algebra/http/ for ResilienceTest,ServerLifecycleTest.
- verifier: new evidence/step-08/attempt-N/ files; no code or log edits.
- orchestrator: log.md, diff review, explicit staging and the local commit.

## Required gate and checkpoint

```bash
mvn -B -Dtest=ResilienceTest,ServerLifecycleTest verify
mvn -B verify
```

Require actual passing assertions, zero failures/errors, zero skipped tests and
the observations specified above. Record command exits and Surefire counts,
not only Maven's final banner. The full suite protects every earlier feature.
Save evidence and follow workflow/checkpoints.md. Intended commit message:

```text
step-08: harden errors and shutdown
```

Stop on a failed gate, student interruption or the chosen STOP_AFTER boundary.
