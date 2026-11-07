# Step 04 — Read bounded request data and echo its bytes

Dependency: 03. Begin only after earlier steps have verified local commits.
The interfaces and expected behavior in contracts/ are specifications to build.

## Build logic and verification cases

Add exact POST /echo routing. Read no more than 4097 bytes from the request
stream. At 0..4096 bytes, return exactly those bytes with status 200 and
application/octet-stream; byte 4097 means 413. Content-Length can be missing
or misleading, so a header-only size check is insufficient. Do not collect an
unbounded stream into memory. Close every exchange even on rejection/failure.
GET /echo returns 405 with Allow: POST.

EchoTest sends empty, ordinary, binary/UTF-8, exactly-4096 and 4097-byte bodies,
checking real bytes and status. Include an HttpClient BodyPublisher of unknown
length (for example ofInputStream) so the limit works without a supplied size.
Unit-test the bounded-read seam if malformed framing is rejected before the
handler. Assert the server still answers health after rejection. Distinguish
an expected 413 from transport failure.

Observe `curl -i -X POST --data-binary 'hello' http://127.0.0.1:8080/echo` from
the packaged JAR and record the returned bytes. Preserve every prior route test.
This is request processing, not a JSON API or multipart-upload exercise.

## Ownership

- java-builder: the production classes required for this step under src/main/java/edu/algebra/http/.
- test-builder: src/test/java/edu/algebra/http/ for EchoTest.
- verifier: new evidence/step-04/attempt-N/ files; no code or log edits.
- orchestrator: log.md, diff review, explicit staging and the local commit.

## Required gate and checkpoint

```bash
mvn -B -Dtest=EchoTest verify
mvn -B verify
```

Require actual passing assertions, zero failures/errors, zero skipped tests and
the observations specified above. Record command exits and Surefire counts,
not only Maven's final banner. The full suite protects every earlier feature.
Save evidence and follow workflow/checkpoints.md. Intended commit message:

```text
step-04: add bounded echo processing
```

Stop on a failed gate, student interruption or the chosen STOP_AFTER boundary.
