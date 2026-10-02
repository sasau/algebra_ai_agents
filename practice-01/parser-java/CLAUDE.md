# parser-java — the Act 1 target

A tiny SQL mini-parser (Java 21, Gradle) shipped with one red test, so you can fix the same failing test five ways: tool, chat, skill, workflow, agent.

- Run the tests: `./gradlew test --tests ParserTest`
- Grammar: `src/main/java/lusql/parser/` · tests: `src/test/java/lusql/parser/`
- **Never edit anything under `src/test/`; fix the source.** A test changed to pass proves nothing.
- Reset between attempts: `git checkout -- src/main`
