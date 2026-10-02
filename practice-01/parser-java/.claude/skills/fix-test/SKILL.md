---
name: fix-test
description: Fix one failing Gradle test without editing the test itself. Use when a test is red and the user wants the source fixed, not the test.
allowed-tools: Bash(./gradlew test *)
argument-hint: "[TestClass or TestClass.method]"
---

Make the red test green by changing the SOURCE it exercises. The test is the specification; it stays exactly as it is.

1. Run it: `./gradlew test --tests $ARGUMENTS` if an argument was given, otherwise `./gradlew test` for the whole suite.
2. Read the failure: first the assertion or exception message, then the stack trace. The first frame that is NOT under `src/test/` names the source file and line to open.
3. Open that source file. Never open a test file to change it — `src/test/**` is read-only for you.
4. Make the smallest change that makes that failure go away. No refactoring, no renaming, no "while I'm here".
5. Rerun step 1.
6. Still red? Go back to step 2 with the new message. Stop when the run is green.
7. Report the diff you made (`git diff -- src/main`) and Gradle's final summary line — nothing else.
