# Step 06 — Connect cookies and session lifecycle to HTTP

Dependency: 05. Begin only after earlier steps have verified local commits.
The interfaces and expected behavior in contracts/ are specifications to build.

## Build logic and verification cases

Add GET and DELETE /session and a small cookie parser. Parse semicolon pairs
across all Cookie header values, matching exactly J03SID. Validate the chosen
fixed ID alphabet/length. Duplicate/malformed J03SID means no usable candidate.
Follow contracts/http.md for creation, reuse, response counts and cookie flags.
Never create a session for unrelated routes. Convert a capacity failure to
503 Session capacity reached without leaking internal details.

DELETE invalidates when possible and always returns bodyless 204 plus the
clearing cookie. Unknown/missing cookies do not allocate a session. An old cookie
sent afterward starts a fresh ID at visits=1. Unsupported methods get 405 with
Allow: GET, DELETE. HTTP I/O must remain outside the store's atomic operation.

SessionHttpTest uses a real server on port 0 and an injected Clock. Check a new
session and Set-Cookie attributes, explicit cookie reuse (2 then 3), an isolated
second client (1), exact-name parsing, multiple headers, malformed/duplicate/
unknown IDs, expiry at the boundary, DELETE including unknown/missing, replay
of the deleted cookie, and full-store 503 while live sessions still work.
Assert the clearing cookie and no 204 body. Do not rely on client cookie state
that hides which ID was sent; inspect headers explicitly.

Observe the README curl cookie-jar sequence using the actual JAR. Keep jars
ignored and preserve a redacted transcript rather than committing personal
runtime state. Demonstrate 1 → 2 → DELETE → a new 1, with different IDs.

## Ownership

- java-builder: the production classes required for this step under src/main/java/edu/algebra/http/.
- test-builder: src/test/java/edu/algebra/http/ for SessionHttpTest.
- verifier: new evidence/step-06/attempt-N/ files; no code or log edits.
- orchestrator: log.md, diff review, explicit staging and the local commit.

## Required gate and checkpoint

```bash
mvn -B -Dtest=SessionHttpTest verify
mvn -B verify
```

Require actual passing assertions, zero failures/errors, zero skipped tests and
the observations specified above. Record command exits and Surefire counts,
not only Maven's final banner. The full suite protects every earlier feature.
Save evidence and follow workflow/checkpoints.md. Intended commit message:

```text
step-06: connect cookie session endpoints
```

Stop on a failed gate, student interruption or the chosen STOP_AFTER boundary.
