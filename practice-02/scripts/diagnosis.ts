import { createHash, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { connect, call } from './client.js';
import { LAB, requireValue, evidence, entryError, variant } from './common.js';
import { TicketStore } from '../src/core/db.js';
import { Workspace } from '../src/core/workspace.js';
import type { TestReport } from '../src/core/reports.js';
import type { Ticket } from '../src/core/db-types.js';

try {
  const workspaceClient = await connect('workspace');
  const ticketsClient = await connect('tickets');
  const store = await TicketStore.create({ variant: variant() });
  try {
    const ticket = requireValue(await call<Ticket>(ticketsClient, 'get_ticket', { ticketId: 'LAB-101' }));
    const run = requireValue(await call<TestReport>(workspaceClient, 'run_tests', { suite: 'tokenizer' }));
    assert.equal(run.status, 'failed', 'The supplied fixture must reproduce its one seeded failure.');
    const source = requireValue(await call<{content:string}>(workspaceClient, 'read_file', { path: 'src/tokenizer.ts' }));
    const resource = await workspaceClient.readResource({ uri: `workspace://reports/${run.runId}` });
    const fresh = requireValue(await call<TestReport>(workspaceClient, 'get_test_report', { runId: run.runId }));
    assert.deepEqual(run, fresh);
    const evidenceDigest = createHash('sha256').update(JSON.stringify(fresh)).digest('hex');
    const submitted = requireValue(await call<{reportId:string}>(ticketsClient, 'create_diagnostic_report', {
      ticketId: ticket.ticketId, runId: run.runId, evidenceDigest, idempotencyKey: randomUUID(),
      summary: 'The tokenizer treats CR as an unsupported character; its LF handling does not normalise CRLF. The supplied CRLF test reproduces the failure. This report diagnoses the defect and does not claim a repair.',
    }));
    // Independent read-back uses a restricted DB role, outside the model and MCP writer.
    const verified = requireValue(await store.verifyStoredReport({ reportId: submitted.reportId,
      ticketId: ticket.ticketId, runId: run.runId, evidenceDigest }));
    const independent = requireValue(await (await Workspace.create({ variant: 'reference' })).runTests({ suite: 'tokenizer' }));
    assert.equal(independent.status, 'failed');
    assert.deepEqual(independent.failedTests, run.failedTests);
    assert.match(source.content, /token/i);
    const result = { ticketId: ticket.ticketId, runId: run.runId, status: run.status,
      failedTests: run.failedTests, reportId: submitted.reportId, evidenceDigest, verified,
      independentRunId: independent.runId, resourceRead: resource.contents.length, sourceRead: true,
      scope: 'Supplied reference checker stores a synthetic lab report. Interactive host calls require review.' };
    await evidence('combined-diagnosis', result);
    console.log('PASS combined diagnosis: ticket + real failing test + bounded source + resource + independently matched DB report.');
    console.log(JSON.stringify(result, null, 2));
  } finally { await Promise.all([store.close(), workspaceClient.close(), ticketsClient.close()]); }
} catch (error) { entryError(error); }
