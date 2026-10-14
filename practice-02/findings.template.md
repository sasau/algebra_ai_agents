# Practice 02 findings

Name / group: …  Date: …  Commit or supplied checkout: …

Label each artifact **my capture**, **supplied observed capture**, or **illustrative example**. Never include `.env`, `.env.local`, keys or passwords.

## 1. Environment and reproducibility

Record Node, npm, CLI, OS, selected variant, Docker/Compose versions and the image digest. List your actual commands, exit status and evidence filenames. Explain which optional checks you did not run. Account for the intentionally failing CRLF fixture separately from verification failures.

## 2. Direct tool and result pairing

Explain the four TODOs you completed and why the handler can be shared. Show a valid read and missing-file result, root/size metadata, and a refused input. Identify `ok`, `error.code`, `retryable` and the difference between a failed test and a failed tool execution. Annotate an illustrative or live `tool_use_id` pairing; state which kind of trace it is.

## 3. Workspace MCP and host authority

List discovered tools, resource, template and prompt; attach the initialize excerpt and the negotiated protocol version. Explain schema rejection versus a JSON-RPC method error. Name the fixed suite, deadline, retained output, concurrency and retention limits. Explain why annotations do not grant authority and record the action you reviewed in default host permission mode.

## 4. Database scope, retries and independent diagnosis

Explain a parameter value, a scoped view, reader/reporter grants and a transaction. Attach the denied role probes and E06 receipts/count across a server restart. Explain the changed-payload conflict. Link the ticket, source, failing run, resource, SHA-256 digest, stored report ID and independent read-back; distinguish a submitted claim from verified evidence.

## 5. Boundary evidence

Fill the six core rows with actual values and evidence links. “The model refused” is not enforcement evidence. Add E07–E12 rows if executed, clearly identifying deterministic probes and historical reconstructions.

| Case | Input / stimulus | Observed result | Independent check | Mechanism and remaining limitation |
| --- | --- | --- | --- | --- |
| E01 missing file | … | … | Later call succeeds in same session: … | … |
| E02 invalid suite | … | … | Spawn-attempt count unchanged, valid control increments: … | … |
| E03 prefix / symlink | … | … | External fake canary remains unread: … | … |
| E04 timeout / excess output | … | … | Descendant gone and retained bytes bounded: … | … |
| E05 SQL / project scope | … | … | Denied grants and unrelated ticket inaccessible: … | … |
| E06 lost response / retry | … | … | New server returns same ID; independent row count one: … | … |

## 6. Cost, limitations and submission verdict

Report definition/result UTF-8 bytes; report model token usage and host `/context` only if actually measured, with conditions. Identify trusted-fixture assumptions, local-user authority, path races, single-project credentials and platform coverage. Explain how the layer becomes the course harness tool component. State what remains incomplete without claiming it passed.

Assessment (12 points): tool contract and shared direct implementation **2**; workspace MCP, discovery and E01–E04 safeguards **3**; parameter binding, scoped data and E05 role denials **3**; durable restart retry, conflict and E06 independent row count **2**; reproducible findings and independently verified combined diagnosis **2**. A green fixture obtained by removing the failing test is not diagnostic evidence.
