# Java 03 — reference HTTP server

Completed Java 21/Maven implementation with health, greeting and byte-echo
routes, cookie sessions, concurrent request handling and a bounded load probe.
The server uses only JDK APIs; JUnit is a test dependency.

From the practices repository root, open `java-practices-03/reference`.
Use JDK 21 and Maven 3.9 or newer. These commands work in macOS Terminal and
Windows PowerShell:

```sh
cd java-practices-03/reference
mvn -B clean verify
java -jar target/java-03-http-server.jar --port 8080
```

Keep the server running. In a second terminal, try:

```sh
curl -i http://127.0.0.1:8080/health
curl -i "http://127.0.0.1:8080/hello?name=Ada"
curl -i -X POST --data-binary hello http://127.0.0.1:8080/echo
curl -i -c cookies.txt http://127.0.0.1:8080/session
curl -i -b cookies.txt http://127.0.0.1:8080/session
curl -i -b cookies.txt -X DELETE http://127.0.0.1:8080/session
```

In Windows PowerShell, spell each HTTP command `curl.exe`. Expect `OK`,
`Hello, Ada!`, exactly `hello`, visit counts 1 then 2, and an empty 204 response
on deletion. Text responses end with a newline; echo returns the exact bytes.

From the reference project directory, with the server still running:

```sh
java -cp target/java-03-http-server.jar edu.algebra.http.LoadProbe http://127.0.0.1:8080 200 10
```

Require 200 correct responses, zero failures, exit 0 and at least 10 successful
requests per second. Inspect the measured rate on your own machine. Stop the
server with Ctrl+C, restart it on the same port and repeat the health check.

[Server documentation](docs/server.md) explains the architecture, routes,
configuration, session expiry, admission limits and shutdown behavior.
[Validation](VALIDATION.md) records the observed reference checks and limits.
The [production source](src/main/java/edu/algebra/http/) and
[tests](src/test/java/edu/algebra/http/) are included for inspection.
