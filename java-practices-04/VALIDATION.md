# Java 04 starter validation

Prepared and checked on 2026-11-16 using macOS arm64, Temurin JDK 21.0.10
and Maven 3.10.0. Checks ran in a temporary staging copy before installation;
the recorded working directory is retained in the evidence.

- `mvn -B -o verify`: **107 tests in 10 suites**, zero failures, errors or
  skipped tests; executable JAR built successfully. Offline mode used the
  existing Maven dependency cache.
- Production source, test source, pom.xml and .gitignore match the completed
  Java 03 reference byte-for-byte. Starting hashes are in
  [baseline-files.sha256](docs/baseline-files.sha256).
- The original plan, ten step files, contracts, workflow, four agent profiles
  and scope draft are preserved unchanged under plans/. Active profiles are
  adapted for an existing project and a planning-first assignment.
- All local Markdown links resolve. All four active agent profiles are present.
  There is no supplied root Java 04 execution plan or custom transport solution.
- Generated target/ files and any .git/ directory are excluded from delivery.

The successful run is recorded in
[attempt-02/verification.md](evidence/baseline/attempt-02/verification.md), with
command timestamps/exits, raw output, Surefire totals and tested-file hashes.
The [first attempt](evidence/baseline/attempt-01/verification.md) failed before
tests because the filesystem sandbox blocked a Maven cache lock. It is retained;
the successful retry used normal filesystem approval.

This validates the supplied JDK-backed baseline. The custom transport remains
the student's assignment. Native Claude Code orchestration, Windows commands,
and a new manual/load run were not executed during this preparation. Historical
Java 03 results are preserved separately in [docs/java03-validation.md](docs/java03-validation.md).
