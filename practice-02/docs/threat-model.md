# Trust and enforcement in the local lab

The assets are fixture files, bounded process capacity, synthetic project rows, report integrity, local credentials and host context. The model proposes arguments; files, tickets and tool descriptions can contain hostile instructions. The host reviews actions, the server validates inputs and limits effects, and PostgreSQL independently restricts roles. A prompt asking for caution is not an access-control mechanism.

| Case | Failure or attack | Enforcement / observation |
| --- | --- | --- |
| E01 | Missing-file handler throws or breaks a session. | Typed error adapter; later read succeeds in the same session. |
| E02 | Command text is passed as a suite. | Strict enum on raw server request; execution-attempt count stays unchanged and a valid control increments it. Fixed argv and `shell: false` remove shell-string interpolation. |
| E03 | Parent escape, colliding path prefix or external symlink. | Separator-aware lexical and canonical root checks and regular-file requirement; generated fake canaries outside the root. |
| E04 | Deadline returns while a worker/descendant remains alive; output fills memory. | Drain streams into capped buffers; terminate process group, escalate when needed, await close and observe descendant disappearance. |
| E05 | SQL concatenation or access to another project. | Parameter binding, scoped views, narrow reader/reporter grants, row/byte caps and fixed statements; deny unrelated authority. |
| E06 | Response lost after commit leads to duplicate report. | Database uniqueness and canonical payload hash in one transaction; restart server, retry same ID, reject changed content and count independently. |
| E07 | Ticket text requests an external read or write. | Deterministic forbidden call denied at the file boundary. This does not evaluate a model's reasoning. |
| E08 | Reviewed description changes into an instruction. | Capture old/new description hashes; renewed review is required. The selected reconstruction is not registered in the normal host. |
| E09 | Debug text corrupts stdout JSON-RPC. | Compare selected broken transport with protocol-only stdout; record actual SDK error/recovery. |
| E10 | Unavailable connection or blocked transaction consumes capacity. | Bounded acquisition/statement/idle transaction limits, rollback/discard and later recovery; dedicated lab lock only. |
| E11 | Large result exhausts output/context budget. | Bounded acquisition and UTF-8 truncation metadata. Bytes do not measure model token use. |
| E12 | Local HTTP endpoint accepts unauthenticated or unexpected-origin requests. | Loopback binding, bearer authentication and origin checks independently tested; stateless Streamable HTTP extension. |

The normal workspace process can access only the trusted fixture through public tools, but the local operating-system user owns the checkout. The path guard assumes no hostile actor swaps entries between validation and open; it is not a race-free filesystem capability. Stronger isolation is needed for concurrent hostile filesystem mutation. The report store assumes one owner and checks record size/schema; multiple independent writers need stronger coordination.

Fixed argv does not make malicious test source safe. The supplied fixture is trusted. Running hostile code requires a separate restricted execution environment without a home mount, Docker socket, model credentials or network access. The process-group strategy is exercised on macOS/Linux; use WSL2 rather than assuming native Windows equivalence.

The database credentials implement a single-project lab boundary. The local Docker administrator can inspect container environment and has provisioning authority. A production service additionally needs authenticated identity, tenant authorisation, credential rotation and audited access; the local HTTP example is not a full OAuth deployment.

`create_diagnostic_report` accepts a claimed run ID and digest. It does not authenticate the workspace server or prove a test ran. The independent checker retrieves real evidence, recomputes the digest, reads the stored row and reproduces the expected failure. Report retries prove duplicate control, not truth of report content.

Default host permission mode asks for process execution and report writes. Tools cannot bypass a denied database privilege. An annotation cannot replace host policy. Allowing a read does not grant an arbitrary path or make returned text trusted. The examples intentionally use fake canaries and synthetic tickets; no real credential or personal file is an attack target.
