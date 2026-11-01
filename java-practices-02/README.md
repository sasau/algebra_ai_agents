# Java Practice 02 — Concurrency

Understand a Java problem and its illustrated solution, then copy one short
build-and-run request. Read the actual output and name the Java mechanism that
establishes the result. The companion slides focus on Java features; supplied
specialists and the Maven skill handle the routine build process.

Canonical source: `/Users/auscumlic/Development/algebra/practices/java-practices-02`.
In the student repository the module is `algebra_ai_agents/java-practices-02`.
The course also supplies slides and a portable ZIP.

## Prepare once

Requirements: JDK 21+, Maven 3.9+, Python 3 and configured Claude Code. Baseline
Java 21 uses no preview APIs. Initial Maven dependency resolution needs network.
The Java examples need no external service, database or runtime model call.

```sh
cd algebra_ai_agents/java-practices-02
java -version
mvn -version
claude
```

In Claude invoke `/maven-boilerplate workspace`. The skill creates only the
empty Maven shell. Normal verify deliberately fails while there are no tests;
the first feature adds its tests and executable JAR launcher. A setup-only
`-DskipTests package` is TESTS NOT RUN and does not validate a feature.

The prepared java-concurrency-tutor builds one classroom step and its tests;
java-concurrency-reviewer verifies it. Their instructions already live in
.claude/agents. The explainer is available for optional detailed HTML reading.
There is no need to learn or rewrite these definitions in this practice.

## First example: thread lifecycle

We want a method that starts a worker and returns the name captured inside its
task. Reading immediately after start can happen too early. Join supplies a
completion boundary and worker-to-caller visibility. A second case calls run
directly and records the caller's name. Study those Java timelines in the slides,
then paste:

```text
Read classroom/01-lifecycle.md. Build only this feature in workspace,
including its narrated JUnit test. Run the focused tests and lifecycle
example, then briefly connect the actual output to start, run and join.
```

The same commands can be run manually from workspace:

```sh
mvn -B -Dtest=LifecycleTest verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar lifecycle
```

Expected: started worker lesson-worker; direct run main when launched from Main.
The test compares directRun with its actual caller rather than a fixed name.

## Continue one Java feature at a time

[Classroom steps](classroom/README.md) supply nine bounded implementation steps:
lifecycle; forced lost update; monitor/atomic repairs; quote aggregation; equal-work
runner; measured comparison; recoverable circular wait; ordered dining; queue
and failure tests. Each slide action is short; details remain in these files.
Older [lesson conversations](lessons/01-lifecycle.md) and [plans](plans/01-lifecycle.md)
remain optional granular reference.

The live core is 120 minutes. Queue implementation, additional failure tests and
deeper CPU interpretation are guided follow-up. Java explanations belong to the
problem, mechanism, diagram and observed result; prompt wording is not an exercise.

## Tests and observations

Every build step includes real unit assertions. Console narration explains
CONCEPT, SETUP, EXECUTE, expected/observed ASSERT values, WHY and LIMIT.
LessonConsole prints the final outcome through a JUnit watcher, so a failed
assertion or timeout fails Maven. Main routes also explain their actual output.
See [TESTING.md](TESTING.md) for all 16 completed reference tests.

After all classroom steps, from workspace:

```sh
mvn -B verify
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar lifecycle
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar races
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar orchestration
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar compare 120 20 5
java -jar target/concurrency-lab-1.0-SNAPSHOT.jar dining
```

The comparison executes identical tasks sequentially, on eight platform workers,
on one platform thread per task and on one virtual thread per task. Correctness
checks compare results, actual thread type and resource bounds, never a speedup.
Three warmups and five measured rounds rotate mode order. Startup, completion
and cleanup are timed; printing and job-list preparation are outside the timer.
Simulated waits do not represent a real service, and no memory data is collected.
The default run can take half a minute or longer. Start with 32 5 5 for a harness check.

Virtual threads do not add cores, fix races or remove service limits. Java 21
monitor blocking can pin carriers; JDK 24 JEP 491 removes monitor-related pinning,
with some native pinning still possible. Record the actual JDK.
The dining animation illustrates one static ownership snapshot and a moving
spoon; it is not a monitor of the Java process. Finite meals do not prove fairness.

## Reference and submission

Students work in the initially absent workspace. The completed reference is
separate; do not copy it as a substitute for building. Its 16 narrated tests pass
on Java 21. [Actual instructor evidence](reference/evidence/README.md) identifies
checked source hashes and observations. [VALIDATION.md](VALIDATION.md) records
the material checks; [EVIDENCE.md](EVIDENCE.md) is the student worksheet.

Optional detailed reading: [illustrated lifecycle reference](reference/explanation/project.html).
Submit source, tests, actual console evidence and a short explanation naming the
Java feature and concurrency guarantee. Instructor output is not student evidence.
