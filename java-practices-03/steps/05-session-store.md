# Step 05 — Build a concurrent, expiring in-memory session store

Dependency: 04. Begin only after earlier steps have verified local commits.
The interfaces and expected behavior in contracts/ are specifications to build.

## Build logic and verification cases

Implement the SessionStore interface in contracts/design.md, without HTTP
cookie integration yet. Use a cryptographic random ID with at least 128 bits
of entropy and a documented fixed URL-safe encoding (for example 16 random
bytes encoded as 22 base64url characters without padding). A candidate ID is
only a lookup; unknown/expired/deleted candidates never become new keys.

Keep purge, lookup/create, count increment, capacity enforcement and delete
atomic. A short synchronized store method is acceptable. Never perform HTTP
I/O or other blocking work under its monitor. Return immutable visit results.
Absolute expiry is createdAt + TTL: now >= expiresAt is expired. Clean expired
entries before a capacity decision. Existing live sessions still work at full
capacity; attempted creation throws SessionCapacityException.

SessionStoreTest injects a mutable Clock. Check first/repeat visits, two clients'
isolation, unknown/deleted ID replacement, expiry just before and exactly at the
boundary, expiry cleanup and a small capacity. Replaying an invalidated ID must
produce a different ID and count 1. Do not wait 30 real minutes or sleep for TTL.

Start concurrent workers with a latch, seed one session first, then perform
200 visits with its fixed ID: counts are exactly 2..201 without duplicates, and
one inspection returns 202. Also race new-session creation against a small
capacity and assert it is never exceeded. Use bounded futures and shut down
workers. Test invalidation/visit ordering at the public operation boundary.

## Ownership

- java-builder: the production classes required for this step under src/main/java/edu/algebra/http/.
- test-builder: src/test/java/edu/algebra/http/ for SessionStoreTest.
- verifier: new evidence/step-05/attempt-N/ files; no code or log edits.
- orchestrator: log.md, diff review, explicit staging and the local commit.

## Required gate and checkpoint

```bash
mvn -B -Dtest=SessionStoreTest verify
mvn -B verify
```

Require actual passing assertions, zero failures/errors, zero skipped tests and
the observations specified above. Record command exits and Surefire counts,
not only Maven's final banner. The full suite protects every earlier feature.
Save evidence and follow workflow/checkpoints.md. Intended commit message:

```text
step-05: add concurrent session store
```

Stop on a failed gate, student interruption or the chosen STOP_AFTER boundary.
