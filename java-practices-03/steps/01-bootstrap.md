# Step 01 — Create the local repository and Maven project

Dependency: none. Begin only after earlier steps have verified local commits.
The interfaces and expected behavior in contracts/ are specifications to build.

## Build logic and verification cases

Confirm the copied kit is outside every existing repository: `git rev-parse
--show-toplevel` must fail before initialization. Check `java -version`,
`mvn -version` (both using JDK 21), Git availability and local commit identity
with `git var GIT_AUTHOR_IDENT`. If identity is missing, request the student's
name/email for repository-local configuration; never invent identity or change
global Git settings. Then run `git init -b main` in this workspace.

Create `pom.xml`, `.gitignore`, package `edu.algebra.http`, `App` and immutable
`ServerConfig`. Pin the plugins/dependency versions from contracts/design.md,
set compiler release 21, Surefire failIfNoTests=true, finalName
java-03-http-server and the executable main manifest. App supports --help and
parses --port; runtime startup is explicitly unavailable until Step 02. Do not
add HTTP handlers, a session store or a framework. Ignore target/, cookies.txt,
IDE/runtime files; retain instructions, log.md and textual evidence in Git.

`AppTest` checks default port 8080, port 0, 1 and 65535, and rejects -1, 65536,
non-numeric, missing and unknown arguments. Check --help does not open a socket.
Keep argument parsing testable without calling System.exit inside tests.

Verify the packaged JAR in addition to JUnit: `java -jar
target/java-03-http-server.jar --help` exits 0 and prints usage. An invalid
argument exits 2. Save actual stdout/stderr and exits. This proves the manifest
and command line work before adding HTTP. Record the initial base as UNBORN.
The first commit includes the supplied kit, bootstrap source, tests and evidence.

## Ownership

- java-builder: pom.xml, .gitignore and src/main/java/edu/algebra/http/; preserve supplied kit files.
- test-builder: src/test/java/edu/algebra/http/ for AppTest.
- verifier: new evidence/step-01/attempt-N/ files; no code or log edits.
- orchestrator: log.md, diff review, explicit staging and the local commit.

## Required gate and checkpoint

```bash
mvn -B -Dtest=AppTest verify
mvn -B verify
```

Require actual passing assertions, zero failures/errors, zero skipped tests and
the observations specified above. Record command exits and Surefire counts,
not only Maven's final banner. The full suite protects every earlier feature.
Save evidence and follow workflow/checkpoints.md. Intended commit message:

```text
step-01: bootstrap Maven project
```

Stop on a failed gate, student interruption or the chosen STOP_AFTER boundary.
