# Actual instructor execution evidence

Captured 2026-11-01 from the canonical Java21 reference, not student work.
`canonical-junit.log`: `mvn -o -B clean verify`, exit0,16 tests, no failures/errors/skips.
JAVA_HOME was `/Users/auscumlic/.sdkman/candidates/java/21.0.10-tem`.
The CLI logs run the packaged JAR with lifecycle, races, orchestration, dining
and compare120 20 5. See lab-validation.json for checked results.
Zero-test and missing-focused-test negative gates deliberately exit nonzero;
setup-only package skips tests and does not validate behaviour.
checked-source-sha256.json identifies the Java/POM files actually validated.
Timing numbers describe this machine and simulated workload only.
