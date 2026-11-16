# Step 03 — Route exact paths and process greeting input

Dependency: 02. Begin only after earlier steps have verified local commits.
The interfaces and expected behavior in contracts/ are specifications to build.

## Build logic and verification cases

Create Router and GreetingHandler (or the agreed equivalent) and reuse
Responses. Use one root JDK context with an exact path dispatcher. Distinguish
unknown path (404) from unsupported method on a known path (405 + Allow).
For now the known paths are /health and /hello. JDK context matching is a
prefix, so registerContext alone cannot establish the contract.

Implement GET /hello with default world and the query behavior in
contracts/http.md. Decode percent escapes and plus as space in UTF-8; reject
blank, duplicate, malformed or over-80-code-point names. Ignore other valid
query parameters. Keep name length distinct from UTF-8 byte length.

RoutingTest checks world, Ada, Ana+Maria and an encoded Unicode name. Assert
the received UTF-8 bytes and header length. Check 400 for blank/duplicate/long
name and decoding failures accepted by the URI parser. Check /health/extra
and /unknown return 404; POST /health and POST /hello return 405 with Allow.
HEAD error responses have no body. A malformed raw URI rejected by the JDK
need not match the application's error body.

Observe `curl -i 'http://127.0.0.1:8080/hello?name=Ada'` from the packaged JAR.
Save the actual output. Do not add echo or session features in this step.

## Ownership

- java-builder: the production classes required for this step under src/main/java/edu/algebra/http/.
- test-builder: src/test/java/edu/algebra/http/ for RoutingTest.
- verifier: new evidence/step-03/attempt-N/ files; no code or log edits.
- orchestrator: log.md, diff review, explicit staging and the local commit.

## Required gate and checkpoint

```bash
mvn -B -Dtest=RoutingTest verify
mvn -B verify
```

Require actual passing assertions, zero failures/errors, zero skipped tests and
the observations specified above. Record command exits and Surefire counts,
not only Maven's final banner. The full suite protects every earlier feature.
Save evidence and follow workflow/checkpoints.md. Intended commit message:

```text
step-03: add exact routing and greeting
```

Stop on a failed gate, student interruption or the chosen STOP_AFTER boundary.
