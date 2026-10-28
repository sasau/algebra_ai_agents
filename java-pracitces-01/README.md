# Java Practice 01 — Optional, one prompt at a time

Learn Java Optional by building informative console examples through Claude. The
first example is deliberately slow: build, add explanations, run manually, ask
Claude to trace actual output to source, then send a separate expected-result
check. Later examples reuse the specialist agent, skills and CLI created in class.

One **120-minute class** covers **case01 creation, case03 mapping and case06
fallback**. The remaining seven cases are guided follow-up. Everything uses one
Java 21 **Maven** project. Concurrency and deadlock exercises belong in later labs.

## Start

Install JDK 21, authenticated Claude Code and Python 3. A trusted Maven Wrapper
seed is supplied; no global Maven installation is required.

```bash
cd algebra_ai_agents/java-pracitces-01
java -version
claude
```

The root intentionally has **no Maven project, active agents, skills or tool yet**.
Students create them through the prompts. Start with [WALKTHROUGH.md](WALKTHROUGH.md)
and [the first agent prompt](prompts/00-create-java-tutor.md). Each
[lesson README](lessons/01-creation/README.md) contains its complete conversation;
there is no separate mandatory brief.

## Agent discovery

`.claude/agents/.gitkeep` preserves the empty agent directory in Git without
installing an active specialist. Start Claude from this project after checkout.
Current Claude Code watches agent directories that existed at startup and loads
new or edited agent definitions within a few seconds, without restarting.

If you created `.claude/agents/` after starting Claude, exit and run
`claude --continue` from the same project to reload definitions and resume the
conversation. See the [agent-file loading documentation](https://code.claude.com/docs/en/sub-agents#write-subagent-files).

Read the [Optional problem and complete API guide](OPTIONAL-API.md) for the class
declaration, method signatures and links to the later worked examples. It is a
reference map; keep building one example at a time.

## The learning sequence

1. Create our first specialist, `java-tutor`, using the seven-section agent template.
2. Build the Maven shell, [save the commenting policy](prompts/01a-java-tutor-comments.md)
   in java-tutor, explain the shell, observe hello and check its expected result
   through separate prompts. Extract a bootstrap skill.
3. Complete case01 slowly: build → explain code → student manual run → Claude
   run/source trace → expected-result check. Repair only if needed, then reobserve/check.
4. Create separate observation and expected-check skills, then a process-execution
   CLI. Update the skills to call its explicit `--observe` and `--check` modes.
5. Build cases 03 and 06 with shorter prompts that reuse these procedures.
6. Add JUnit, write tests, explain assertions and run them in separate steps.
   Extend the tool and create a final verification skill.
7. Continue the remaining cases using the existing tooling and add their tests
   to the same suite.

## Cases

| Case | Optional topic | Pace | Complete prompts and explanation |
|---|---|---|---|
| case01 | Creation — of, ofNullable and empty | Live | [Lesson](lessons/01-creation/README.md) |
| case02 | Lookup — return absence and choose an action | Follow-up | [Lesson](lessons/02-lookup/README.md) |
| case03 | map — transform a contained value | Live | [Lesson](lessons/03-mapping/README.md) |
| case04 | filter — keep only eligible values | Follow-up | [Lesson](lessons/04-filtering/README.md) |
| case05 | flatMap — combine Optional-returning lookups | Follow-up | [Lesson](lessons/05-flatmapping/README.md) |
| case06 | Fallback — distinguish eager and lazy evaluation | Live | [Lesson](lessons/06-fallback/README.md) |
| case07 | Required value — translate absence into an exception | Follow-up | [Lesson](lessons/07-required/README.md) |
| case08 | or — try a second Optional-producing source | Follow-up | [Lesson](lessons/08-alternatives/README.md) |
| case09 | stream — collect only the present values | Follow-up | [Lesson](lessons/09-streams/README.md) |
| case10 | OptionalInt — represent a missing numeric result | Follow-up | [Lesson](lessons/10-primitive/README.md) |

## Narration, observation and expected checking

Ordinary `System.out` lines explain input, operation and outcome. Stable lines
starting `RESULT ` expose observations calculated from real method calls.
`expected/*.txt` lists only those stable lines. Checks compare every RESULT line
in order and require exit0/empty stderr, while allowing other explanatory stdout.
Never change fixtures to make an implementation pass.

A source-to-output trace explains **what happened**. The expected check evaluates
**whether the specified result was obtained**. A correct trace can describe wrong
code. Editing source makes previous execution evidence stale.

After the corresponding tool step:

```bash
python3 tools/run_case.py case03 --observe
python3 tools/run_case.py case03 --check
./mvnw clean verify
python3 tools/run_case.py --all --check --tests
```

The CLI runs Maven and a real JVM; Claude explains the source. The CLI is an ordinary
program invoked through Bash. The application contains no model calls.

## Supplied versus student-created

- `lessons/`, `prompts/`, `expected/`: complete teaching conversations and fixed observations.
- `resources/agent-template.md`: the seven-section role structure.
- `resources/agents/`, `resources/skills/`, `resources/run-case-tool.py.txt`: inactive
  comparison examples; they are not installed in the root workspace.
- `resources/maven-wrapper/`: official Wrapper 3.3.2 pinning Maven 3.9.9.
- `reference/`: completed answer key, separate from student sources.
- `.claude/agents/`: supplied as a placeholder directory; students create the agent definitions.
- Root `.claude/skills/`, `pom.xml`, `src/` and `tools/`: students create these
  through the staged prompts.
- `work/evidence.md`: worksheet for actual results and prompt improvements.

The verified live reference has **3 cases and 9 tests**; the full reference has
**10 cases and 30 tests**. Read actual reports rather than assuming those counts.
See [slides](SLIDES.md), [instructor guidance](INSTRUCTOR.md),
[sources](SOURCES.md) and [validation](VALIDATION.md).
