# Java 03 — build an HTTP server with resumable agents

Start with this prepared plan and an empty Java project. The orchestrator creates
the repository and Maven project in Step 01, then delegates one small change at a
time. Each completed step has implementation, independent verification, durable
evidence in `log.md`, and its own local Git commit. There is no completed server
or hidden reference solution in this kit.

## Prepare a fresh workspace

Requirements: JDK **21**, Maven **3.9+**, Git, curl and a configured coding agent
with terminal access. The course uses Claude Code and project agents in
`.claude/agents/`. A configured Claude account is needed for agent work; the Java
server and its tests do not call an LLM or need an API key. Maven needs access to
Maven Central on its first build, or a populated local cache.

From the root of a clone of `algebra_ai_agents`, copy the kit **outside that
clone**. Choose a destination that does not already exist:

```bash
cp -R java-practices-03 ../java-practices-03-work
cd ../java-practices-03-work
java -version
mvn -version
git --version
git rev-parse --show-toplevel
```

The last command must fail with “not a git repository”. This is expected before
Step 01. If it succeeds, choose a destination outside that existing repository.
Do not initialize a nested repository in the practices checkout. Alternatively,
download the course ZIP and extract `java-practices-03` outside every existing repository.
On Windows, use your file manager to copy the complete folder, including
`.claude`, or use `Copy-Item -Recurse java-practices-03 ..\java-practices-03-work` in PowerShell.

## Start, observe, stop and resume

1. Read [the server contract](contracts/http.md) and [the build plan](plan.md).
2. Start `claude --agent orchestrator` **inside the fresh copy**. Paste
   [kickoff.md](kickoff.md). This uses Claude Code's native project agent.
   The main conversation is the orchestrator; it reads
   `.claude/agents/orchestrator.md` as its operating instructions.
3. The default is **one step per kickoff** (`STOP_AFTER=01`). After inspecting
   that commit, use [prompts/continue.md](prompts/continue.md) with the next stop
   point. Set a later step, such as `STOP_AFTER=10`, to continue automatically
   through that checkpoint. A stop point never means skipping earlier steps.
4. Follow [log.md](log.md), `git status --short`, `git log --oneline` and
   `git show --stat HEAD`. Actual command transcripts live in `evidence/`.
5. Use [prompts/stop.md](prompts/stop.md) to stop at a stable boundary or
   immediately. After closing/clearing context, paste [resume.md](resume.md).

Every stop point is student-controlled. A failed check prevents advancement.
An interrupted step is resumed, not counted as complete. Only the orchestrator
updates `log.md`, coordinates writers and makes commits. The workers propose
changes; a worker's “done” message is not acceptance evidence.

## Supplied artifacts and created artifacts

| Supplied now | Created during the build |
|---|---|
| `plan.md`, `contracts/`, `steps/01`–`10` | `.git/`, `pom.xml`, `.gitignore` |
| `AGENTS.md`, `CLAUDE.md`, four agent definitions | `src/main/java/`, `src/test/java/` |
| Kickoff, continuation, stop and resume prompts | Runnable JAR under `target/` |
| Pending `log.md`, verification and recovery protocols | Step evidence and local commits |

Each [step specification](steps/01-bootstrap.md) names its scope, files, tests,
commands, expected results, evidence and commit message. The supplied interface
contract is a design specification: its named Java classes do not exist yet.

## Finished application

Java 21 + Maven, using `com.sun.net.httpserver.HttpServer` from `jdk.httpserver`.
The JDK parses HTTP and manages connections. Students build routing, response
logic, cookie sessions, session expiry, concurrency limits, tests and lifecycle.
Use simple text responses and an in-memory store. This is a loopback classroom
server; sessions are visit counters, with no login or authenticated identity.

Final commands, **available only after their steps are built**:

```bash
mvn -B verify
java -jar target/java-03-http-server.jar --port 8080
# In another terminal:
curl -i http://127.0.0.1:8080/health
curl -i 'http://127.0.0.1:8080/hello?name=Ada'
curl -i -c cookies.txt http://127.0.0.1:8080/session
curl -i -b cookies.txt http://127.0.0.1:8080/session
curl -i -b cookies.txt -X DELETE http://127.0.0.1:8080/session
java -cp target/java-03-http-server.jar \
  edu.algebra.http.LoadProbe http://127.0.0.1:8080 200 10
```

Use Ctrl+C in the server terminal to exercise orderly shutdown. The load probe
is built in Step 09; its results must be measured, never copied from the slides.
An indicative classroom target is at least **10 successful requests/second** on
the student's loopback machine, with all 200 responses correct. Hardware and
client overhead affect the rate; correctness and test results are separate.

The course hub links the practice slides and starter ZIP. See
[COURSE_LINKS.md](COURSE_LINKS.md) for their exact repository paths. Changes
prepared locally are available on the remote only after publication.
