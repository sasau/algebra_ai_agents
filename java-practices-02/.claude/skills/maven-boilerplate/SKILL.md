---
name: maven-boilerplate
description: Create an empty Java 21 Maven project for a Java exercise, with pinned build plugins, JUnit 5 and separate main/test source trees. Use for a new project, not to replace or migrate an existing build.
---

Create only the Maven shell; the student adds application code in later steps.
Use `workspace` when no target was supplied. Run the bundled script from the lab
root, resolving its location from this skill's directory:

```sh
python3 .claude/skills/maven-boilerplate/scripts/bootstrap.py workspace
```

The script accepts `--group-id`, `--artifact-id` and `--package`; use defaults
unless the task specifies them. It creates `pom.xml`, `.gitignore`, a short
project README and conventional empty Java source/test package directories.
It refuses a nonempty destination before writing anything. If the target already
has files, inspect and explain the existing build rather than overwriting it or
choosing a different directory silently.

Explain Java `release=21`, UTF-8, the main/test source separation, JUnit's test-only
scope and the compile/test/package/verify lifecycle. Check `java -version` and
`mvn -version` when environment verification is requested. Maven 3.9 or newer and
JDK 21 or newer are prerequisites; the project uses Java 21 language/API features.

The scaffold has no main class, domain features, example tests or executable JAR
manifest. A plain JAR becomes available after packaging; add a launcher only in
the later requested feature step. Do not copy the instructor reference or create
concurrency implementations during bootstrap. Do not install global tools.

Surefire fails if no tests exist, prints test stdout to the console, retains full
failure traces and runs classes alphabetically. Explain why these settings make
the classroom validation observable. Each later feature test prints its concept,
setup, execution, expected/observed checks, interpretation and final JUnit verdict.

For a scaffold-only request report paths and mark tests NOT RUN. The empty shell
has no feature yet; its setup-only command is `mvn -B -DskipTests package`. Label
this explicitly as TESTS NOT RUN. A normal `mvn -B verify` must fail until the
first feature has unit tests. Once feature tests exist, use `mvn -B verify` or
`mvn -B -Dtest=LifecycleTest verify` and require actual nonzero passing test totals.
Do not disable failIfNoTests or treat console narration as an assertion.
Dependencies require network access on first use.
