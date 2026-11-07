# Reference validation — 2026-11-07

The installed reference was independently built and tested in this directory,
using macOS arm64, Temurin JDK 21.0.10 and Maven 3.10.0.

- `mvn -B clean verify`: **107 tests**, zero failures, errors or skipped tests.
- All ten required behavioral test classes were present in Surefire reports.
- Packaged JAR: CLI help/invalid argument exits, route bodies and headers,
  Unicode and validation boundaries, binary/oversized/chunked echo, cookie
  creation/reuse/deletion/replay and malformed-cookie handling passed.
- 200 concurrent requests using one shared cookie produced each count 2..201
  exactly once, followed by 202.
- The actual macOS commands from the manual-check slides returned all fourteen
  expected statuses. PowerShell is unavailable here; Windows commands were
  reviewed but **not executed**.
- Packaged load probe: 200 requests, 10 clients, **200 correct, 0 failures**,
  **0.060750 seconds**, **3292.158 successful requests/second**, exit 0.
- Ctrl+C shutdown, same-port restart, health and loss of in-memory sessions on
  restart passed. Only the audit's own Java processes were stopped.

The load result is a short local observation, not a capacity guarantee. Session
state is in memory; this loopback classroom service has no login, persistence
or TLS. The admission cap limits application work, not every socket or memory
allocation.

The implementation, tests and Maven file matched the verified build byte for
byte. The delivered source has no nested Git metadata or duplicated orchestration
history. Normal Maven output under `target/` is ignored.

The reference was built through sequential Codex collaboration roles after the
native Claude launcher could not complete the workflow. A separate native
Claude Code smoke run did not reach an accepted checkpoint. The supplied
instructions were repaired from those observations; successful Java validation
does not establish successful unattended native Claude orchestration.
