# Java 04 — build our own HTTP transport

Start with the completed Java 03 web server in this directory. Your first
deliverable is your own orchestrated build plan. Then use it to replace the
JDK HTTP server with a small HTTP/1.1 transport that you build with agents.
The new transport must preserve the application's existing behavior.

Java 21, Maven, production code and tests are already here. There is no new
transport implementation or supplied Java 04 execution plan. The original
Java 03 plan is reference material under [plans/](plans/README.md).

## Run the starting server

Use JDK 21 and Maven 3.9 or newer. From this directory:

```sh
java -version
mvn -version
mvn -B verify
java -jar target/java-03-http-server.jar --port 8080
```

In another terminal:

```sh
curl -i http://127.0.0.1:8080/health
curl -i "http://127.0.0.1:8080/hello?name=Ada"
curl -i -X POST --data-binary hello http://127.0.0.1:8080/echo
curl -i -c cookies.txt http://127.0.0.1:8080/session
curl -i -b cookies.txt http://127.0.0.1:8080/session
curl -i -b cookies.txt -X DELETE http://127.0.0.1:8080/session
```

In Windows PowerShell use `curl.exe`. Expect `OK`, `Hello, Ada!`, the
echoed bytes, visit counts 1 then 2, and an empty 204 response on deletion.
Stop the server with Ctrl+C. The inherited Maven artifact and JAR retain
their Java 03 names so the starting source and commands stay consistent.
See [server documentation](docs/server.md) and [starter validation](VALIDATION.md).

## What you will replace

A browser sends bytes over a TCP connection. Today JDK `HttpServer` accepts
that connection, reads HTTP and calls our handler. Your code will take over
those jobs. Java still supplies TCP through `ServerSocket`, socket streams
and virtual threads. The JDK HTTP client may remain in tests and LoadProbe.

```text
client sends HTTP bytes
         |
         v
YOUR TRANSPORT: accept -> parse -> read body -> call handler -> write response -> close
                                                   |
                                                   v
EXISTING APPLICATION:                         routes and sessions
```

Keep health, hello, binary echo, cookies, session expiry, atomic visit
counts and shutdown behavior. Start with one request per connection and
`Connection: close`. The final core must handle bounded chunked request
bodies as well as Content-Length: the current echo tests already require
both. A fixed-length-only intermediate build is not full compatibility.

Bound metadata, body bytes, reads, active connections and shutdown. A limit
on connected clients protects a different resource from the application's
existing limit on requests inside handlers. Keep a runnable JDK-backed
version and compare both through shared application tests. TLS, HTTP/2,
HTTP/3, compression and WebSockets are outside the exercise; persistent
connections are optional. This is an educational HTTP/1.1 subset.

## Make the plan before building

1. Read [assignment.md](assignment.md), the current code and tests, and the
   [scope draft](plans/next-practice.md).
2. Read [the original Java 03 plan](plans/java03-reference/plan.md) for its
   structure, ownership and evidence rules. Its bootstrap work is already
   done here; design your own Java 04 steps and dependencies.
3. Start your coding agent here. With Claude Code, use
   `claude --agent orchestrator`, then paste [kickoff.md](kickoff.md).
   The main session coordinates the three worker roles. An agent using
   another harness reads AGENTS.md and adopts the same role; it must report
   honestly if native worker delegation is unavailable.
4. Review the resulting `plan.md`, step files, contracts and pending log.
   Explain the order, the owner of each change, and how a failed step stops
   progress. The planning prompt stops before implementation.
5. To execute, use a fresh independent copy outside the shared practices
   repository. Copy this entire directory, including hidden `.claude/`
   and `.gitignore`; leave `target/` and any `.git/` behind. Confirm the
   copy has no enclosing Git repository with `git rev-parse --show-toplevel`
   (it should fail before initialization). Use [the execution prompt](prompts/execute.md)
   with the first stop point from your reviewed plan. The orchestrator
   records a verified baseline commit before the first implementation step.

All agent roles are build-time instructions. No agent or model runs inside
the HTTP server. Planning can happen in this course checkout; implementation
checkpoint commits belong in the independent student workspace.

## Included and student-created files

| Included in this starter | You create during planning and execution |
|---|---|
| `src/`, `pom.xml`, `.gitignore`, baseline server docs | Custom transport and its tests |
| `.claude/agents/`: orchestrator, java-builder, test-builder, verifier | `plan.md` and detailed `steps/` |
| `plans/java03-reference/` and the next-practice scope draft | `contracts/transport.md` and interface decisions |
| Kickoff, execute, continue, stop and resume prompts | A pending checkpoint table, later evidence and local commits |
| `workflow/`, initial planning-state `log.md` | A measured compatibility and load report |

Use [resume.md](resume.md) after clearing context and [prompts/stop.md](prompts/stop.md)
to stop. This exercise continues across checkpoints; the full protocol build
is not assumed to fit one 120-minute class.
