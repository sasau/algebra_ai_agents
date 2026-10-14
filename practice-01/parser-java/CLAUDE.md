# parser-java — the Act 1 target

A tiny Java SQL parser with one deliberately failing WHERE test. Students compare
five approaches; the test command and workflow report the failure, while the
advice, skill and agent comparisons can lead to a source fix.

- Run: `./gradlew test --tests ParserTest --rerun-tasks`.
- Source: `src/main/java/lusql/parser/`; tests: `src/test/java/lusql/parser/`.
- Never edit tests, Gradle configuration, wrapper files or skill instructions to make a test pass.
- Work only in the current disposable `.runs/act1-.../parser-java` copy.
- Do not reset or discard student edits. A new comparison uses a fresh copy,
  created by `node "$P01_ROOT/scripts/prepare-run.mjs" act1` from the practice.
- When `P01_ROOT` is exported, compare source with
  `diff -ru "$P01_ROOT/parser-java/src/main" src/main` (exit 1 means differences).
  Otherwise summarize the exact source files changed and show the test verdict;
  `git diff` may be empty because disposable copies are ignored by the parent repository.
