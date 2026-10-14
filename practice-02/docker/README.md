# PostgreSQL is the backend; MCP resources are representations

`ticket-store` runs locally over stdio. It connects to an official PostgreSQL 17.11
container on `127.0.0.1:55432`. The MCP resource `tickets://schema` describes fields;
it is not the container or a database connection.

From `algebra_ai_agents/practice-02/`:

```sh
npm run db:up
npm run db:probe
npm run db:verify
npm run db:down
```

Setup generates three disposable passwords in `.env.local` with file mode `0600`.
This file is ignored by Git. Do not print it, commit it, or copy it into findings.
The administrative password is used for container initialisation and explicit
setup/verifier commands. MCP uses only `lab_reader` and `lab_reporter`. The runtime
loader selects the relevant keys; it does not source shell code, mutate the process
environment, or read the optional model API configuration.

If port 55432 is occupied, run the following from the lab terminal:

```sh
export LAB_DB_PORT=55433
npm run db:up
npm run db:probe
LAB_VARIANT=starter claude
```

Keep `LAB_DB_PORT` exported in that terminal for later security checks and diagnosis.
For a new terminal, export the same value before running lab commands or restarting
the host. Setup saves the selected port, but the MCP launcher and supplied clients
otherwise explicitly select 55432, overriding `.env.local`. A changed local configuration
does not rotate a password already stored in the database volume: restore the old
file, or explicitly reset this disposable lab.

`lab_reader` can select a curated view of `lab-a` tickets and report evidence. The
other project's ticket, base tables, and private canary table are ungranted. The
reporter can select scoped tickets and select/insert reports, but cannot update or
delete tickets/reports or create tables. A check constraint and scoped foreign key
prevent inserting a report for another project. These are single-project lab
credentials, not a production identity or tenant-authentication design. The local
user who controls files and Docker still has setup authority.

E05 probes issue fixed SQL through both restricted roles. Quotes in a ticket ID
remain a parameter value. A query can be SQL-safe while its returned ticket text is
still an untrusted prompt-injection attempt (`LAB-103`). E06 inserts a report,
discards its response, recreates the store, retries, and checks the row count using
independent administrative SQL. The same payload returns the original report ID;
a changed payload returns `IDEMPOTENCY_CONFLICT`. E10 holds a row lock to trigger
the three-second statement timeout and checks rollback, connection cleanup, and
recovery. Integration tests also simulate an unreachable port without touching
unrelated containers.

The Compose project is `course-c-practice02`, and its volume is
`course-c-practice02-postgres`. `db:down` retains that volume and all reports.
**Destructive reset:** `npm run db:reset -- --confirm-lab-reset` stops only this
project and removes only its named volume. It erases the seeded database and all
local diagnostic reports in that volume. The command requires the explicit flag
and does not restart the service; run `db:up` afterwards. Never use global Docker
pruning or remove other projects' volumes for this practice.

The image is pinned to release `17.11-bookworm` and multi-platform index digest
`sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826`.
On 2026-10-13 the Docker official-images source and Docker registry confirmed this
tag and linux/amd64 plus linux/arm64 manifests. The pinned image was pulled and used
for the integration checks on the recorded machine; manifest availability for both
platforms does not claim both CPUs were executed. PostgreSQL 17 is a supported
major release; review new patch releases and re-pin before future course runs.
Sources: <https://github.com/docker-library/official-images/blob/master/library/postgres>,
<https://www.postgresql.org/support/versioning/>.

The service has a readiness check, one CPU, 256 MiB memory, a PID limit, and no home
directory or Docker socket mount. Passwords exist in the container environment,
which the local Docker administrator can inspect. Container stdout and PostgreSQL
messages are not pasted into protocol or student evidence files; the scripts emit
sanitised status and error summaries. If a command fails, check Docker is running,
Compose is installed (`docker compose` or `docker-compose`), and the chosen port
is free. `npm run db:probe` gives a bounded connection failure when PostgreSQL is
unavailable.
