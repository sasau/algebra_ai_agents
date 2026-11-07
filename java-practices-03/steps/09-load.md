# Step 09 — Measure multiple requests per second against the packaged server

Dependency: 08. Begin only after earlier steps have verified local commits.
The interfaces and expected behavior in contracts/ are specifications to build.

## Build logic and verification cases

Create LoadProbe with JDK HttpClient and bounded fixed-size client concurrency.
Accept origin, positive count and concurrency (1..count). Set connect/request
timeouts and an overall bounded completion wait. Send exactly N GET /health
requests using at most C client workers. Count a success only for 200 and exact
OK newline. Count transport/timeouts/status/body failures, release all resources
and exit nonzero on any failed request or invalid arguments.

Measure elapsed time with System.nanoTime from first submission until all
results are collected. Print requests, concurrency, successes, failures, elapsed
seconds and successful requests/second. Do not include Maven startup in service
throughput, report an assumed rate or confuse threads with successful requests.

LoadProbeTest uses ephemeral servers: all-correct responses succeed, injected
wrong body/non-200 and refused connection fail, invalid arguments fail, and
timeouts terminate within a bound. These are correctness tests; do not turn a
machine-speed threshold into a flaky JUnit assertion.

After mvn verify, launch the actual JAR. Run `java -cp
target/java-03-http-server.jar edu.algebra.http.LoadProbe
http://127.0.0.1:8080 200 10` as one command. Capture environment, exact command,
exit code and all measurements; stop the process and check cleanup. Goal: all
200 correct, zero failures and at least 10 successful requests/second. A slow
run must be logged as below target and investigated before calling this step
verified. Record environment limitations openly; do not lower the target or
substitute an expected number. Use client concurrency below the default cap.

## Ownership

- java-builder: the production classes required for this step under src/main/java/edu/algebra/http/.
- test-builder: src/test/java/edu/algebra/http/ for LoadProbeTest.
- verifier: new evidence/step-09/attempt-N/ files; no code or log edits.
- orchestrator: log.md, diff review, explicit staging and the local commit.

## Required gate and checkpoint

```bash
mvn -B -Dtest=LoadProbeTest verify
mvn -B verify
```

Require actual passing assertions, zero failures/errors, zero skipped tests and
the observations specified above. Record command exits and Surefire counts,
not only Maven's final banner. The full suite protects every earlier feature.
Save evidence and follow workflow/checkpoints.md. Intended commit message:

```text
step-09: measure concurrent HTTP requests
```

Stop on a failed gate, student interruption or the chosen STOP_AFTER boundary.
