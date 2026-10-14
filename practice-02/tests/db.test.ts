import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { test } from 'node:test';
import pg from 'pg';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { canonicalReportPayloadHash, DB_LIMITS, restrictedPoolConfig, TicketStore, type DiagnosticReportInput } from '../src/core/db.js';
import { loadDbEnvironment } from '../src/core/db-env.js';
import type { Result } from '../src/core/result.js';
import { createTicketServer } from '../src/servers/ticket-store.js';
import { createAdminPool } from '../scripts/db.js';

const { Pool } = pg;
const integration = { skip: process.env.LAB_DB_TESTS !== '1' ? 'Requires db:up and LAB_DB_TESTS=1 (LAB_DB_TESTS=1 npm test).' : false };
function value<T>(result: Result<T>): T { assert.equal(result.ok, true, JSON.stringify(result)); if (!result.ok) throw new Error('Unexpected error.'); return result.value; }
function errorCode(result: Result, code: string): void { assert.equal(result.ok, false); if (result.ok) throw new Error('Unexpected success.'); assert.equal(result.error.code, code); }
function payload(): DiagnosticReportInput {
  return { ticketId: 'LAB-101', runId: randomUUID(), summary: 'Independent synthetic integration probe.',
    evidenceDigest: createHash('sha256').update('SYNTHETIC_EVIDENCE').digest('hex'), idempotencyKey: `test-${randomUUID()}` };
}
async function reportCount(admin: InstanceType<typeof Pool>, key: string): Promise<number> {
  const query = await admin.query<{ count: number }>({ text: `SELECT count(*)::integer AS count FROM lab_api.diagnostic_reports
    WHERE project_id = 'lab-a' AND idempotency_key = $1`, values: [key] });
  return query.rows[0]!.count;
}

test('canonical payload hash covers report data, independent of key and object insertion order', () => {
  const input = payload();
  assert.equal(canonicalReportPayloadHash(input), canonicalReportPayloadHash({ idempotencyKey: 'different-key',
    summary: input.summary, ticketId: input.ticketId, evidenceDigest: input.evidenceDigest, runId: input.runId }));
  assert.notEqual(canonicalReportPayloadHash(input), canonicalReportPayloadHash({ ...input, summary: input.summary + ' changed' }));
});

test('invalid inputs fail before connection acquisition, including UTF-8 byte cap and extra authority', async () => {
  const store = await TicketStore.create({ variant: 'reference', config: { host: '127.0.0.1', port: 65534, database: 'practice02', readerPassword: 'x', reporterPassword: 'x' } });
  try {
    errorCode(await store.getTicket({ ticketId: 'LAB-101', project: 'lab-b' }), 'INVALID_INPUT');
    errorCode(await store.getTicket({ ticketId: 'x'.repeat(65) }), 'INVALID_INPUT');
    errorCode(await store.listTickets({ limit: 51 }), 'INVALID_INPUT');
    errorCode(await store.listTickets({ status: "open' OR '1'='1" }), 'INVALID_INPUT');
    errorCode(await store.listTickets({ cursor: 'not-a-real-cursor' }), 'INVALID_INPUT');
    errorCode(await store.createDiagnosticReport({ ...payload(), summary: '界'.repeat(667) }), 'INVALID_INPUT');
    errorCode(await store.createDiagnosticReport({ ...payload(), runId: '../../run' }), 'INVALID_INPUT');
    errorCode(await store.createDiagnosticReport({ ...payload(), evidenceDigest: 'not-a-digest' }), 'INVALID_INPUT');
    assert.deepEqual(store.poolState(), { readerTotal: 0, reporterTotal: 0, waiting: 0 });
  } finally { await store.close(); }
});

test('E05 scoped prepared lookup treats quotes as data and both roles deny unrelated authority', integration, async () => {
  const store = await TicketStore.create({ variant: 'reference' });
  const admin = await createAdminPool();
  try {
    const ticket = value(await store.getTicket({ ticketId: 'LAB-101' }));
    assert.match(ticket.title, /CRLF/u);
    errorCode(await store.getTicket({ ticketId: "LAB-101' OR '1'='1" }), 'NOT_FOUND');
    errorCode(await store.getTicket({ ticketId: 'OTHER-201' }), 'NOT_FOUND');
    const denied = value(await store.inspectPermissions());
    assert.equal(denied.checks.length, 8);
    assert.ok(denied.checks.every(check => check.denied && check.sqlState === '42501'));
    const original = await admin.query<{ title: string }>("SELECT title FROM lab_data.tickets WHERE project_id = 'lab-a' AND ticket_id = 'LAB-101'");
    assert.equal(original.rows[0]!.title, ticket.title);
    const config = await loadDbEnvironment();
    const reporter = new Pool(restrictedPoolConfig(config, 'reporter'));
    try {
      await assert.rejects(reporter.query('SET ROLE lab_admin'), (error: unknown) => (error as { code?: string }).code === '42501');
      const input = payload();
      await assert.rejects(reporter.query({ text: `INSERT INTO lab_api.diagnostic_reports
        (report_id, project_id, ticket_id, run_id, summary, evidence_digest, idempotency_key, payload_hash)
        VALUES ($1, 'lab-b', 'OTHER-201', $2, $3, $4, $5, $6)`, values: [randomUUID(), input.runId, input.summary,
          input.evidenceDigest, input.idempotencyKey, canonicalReportPayloadHash(input)] }),
      (error: unknown) => (error as { code?: string }).code === '23514');
    } finally { await reporter.end(); }
  } finally { await store.close(); await admin.end(); }
});

test('starter query is explicitly incomplete or returns the correct scoped ticket after TODO 04 is completed', integration, async () => {
  const starter = await TicketStore.create({ variant: 'starter' });
  try {
    const result = await starter.getTicket({ ticketId: 'LAB-101' });
    if (result.ok) assert.equal(result.value.ticketId, 'LAB-101');
    else errorCode(result, 'NOT_IMPLEMENTED');
  }
  finally { await starter.close(); }
});

test('acquisition and response bounds cover long fields, 50 rows, UTF-8 and stable pagination', integration, async () => {
  const store = await TicketStore.create({ variant: 'reference' });
  try {
    const result = await store.getTicket({ ticketId: 'LAB-104' });
    const ticket = value(result);
    assert.equal(ticket.truncated, true);
    assert.ok(ticket.reproductionSteps.length <= 1000);
    assert.ok(Buffer.byteLength(JSON.stringify(result)) <= DB_LIMITS.resultBytes);
    const seen = new Set<string>();
    let cursor: string | undefined;
    let total = 0;
    let observedByteTruncation = false;
    do {
      const result = await store.listTickets({ limit: 50, ...(cursor ? { cursor } : {}) });
      const page = value(result);
      assert.ok(page.tickets.length <= 50);
      assert.ok(Buffer.byteLength(JSON.stringify(result), 'utf8') <= DB_LIMITS.resultBytes);
      observedByteTruncation ||= page.truncated;
      for (const row of page.tickets) { assert.ok(!seen.has(row.ticketId)); seen.add(row.ticketId); total++; }
      assert.ok(total <= 100, 'Pagination must terminate.');
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    assert.equal(total, 64);
    assert.ok(!seen.has('OTHER-201'));
    assert.equal(observedByteTruncation, true);
  } finally { await store.close(); }
});

test('E06 lost response after commit survives store restart, retries one ID, and rejects changed payload', integration, async () => {
  const input = payload();
  let store = await TicketStore.create({ variant: 'reference' });
  const admin = await createAdminPool();
  try {
    // Discard the response at the caller. The database commit has already happened.
    await store.createDiagnosticReport(input);
    const independentlyStored = await admin.query<{ reportId: string }>({ text: `SELECT report_id AS "reportId"
      FROM lab_api.diagnostic_reports WHERE project_id = 'lab-a' AND idempotency_key = $1`, values: [input.idempotencyKey] });
    const firstId = independentlyStored.rows[0]!.reportId;
    await store.close();
    store = await TicketStore.create({ variant: 'reference' });
    const retry = value(await store.createDiagnosticReport(input));
    assert.deepEqual(retry, { reportId: firstId, replayed: true });
    assert.equal(await reportCount(admin, input.idempotencyKey), 1);
    errorCode(await store.createDiagnosticReport({ ...input, summary: 'Changed summary.' }), 'IDEMPOTENCY_CONFLICT');
    assert.equal(await reportCount(admin, input.idempotencyKey), 1);
    const readBack = value(await store.getReportForVerification({ reportId: firstId }));
    assert.equal(readBack.evidenceDigest, input.evidenceDigest);
    assert.equal(readBack.runId, input.runId);
    errorCode(await store.verifyStoredReport({ reportId: firstId, ticketId: input.ticketId, runId: input.runId, evidenceDigest: '0'.repeat(64) }), 'EVIDENCE_MISMATCH');
    value(await store.verifyStoredReport({ reportId: firstId, ticketId: input.ticketId, runId: input.runId, evidenceDigest: input.evidenceDigest }));
  } finally { await store.close(); await admin.end(); }
});

test('E06 concurrent same-key submissions converge on one durable report, including changed-payload races', integration, async () => {
  const stores = await Promise.all(Array.from({ length: 4 }, () => TicketStore.create({ variant: 'reference' })));
  const admin = await createAdminPool();
  try {
    const input = payload();
    const receipts = (await Promise.all(stores.map(store => store.createDiagnosticReport(input)))).map(value);
    assert.equal(new Set(receipts.map(receipt => receipt.reportId)).size, 1);
    assert.equal(receipts.filter(receipt => !receipt.replayed).length, 1);
    assert.equal(await reportCount(admin, input.idempotencyKey), 1);
    const raced = payload();
    const responses = await Promise.all([
      stores[0]!.createDiagnosticReport(raced), stores[1]!.createDiagnosticReport({ ...raced, summary: 'Different raced payload.' }),
    ]);
    assert.equal(responses.filter(result => result.ok).length, 1);
    const rejected = responses.find(result => !result.ok)!;
    errorCode(rejected, 'IDEMPOTENCY_CONFLICT');
    assert.equal(await reportCount(admin, raced.idempotencyKey), 1);
  } finally { await Promise.all(stores.map(store => store.close())); await admin.end(); }
});

test('E10 blocked report times out, rolls back, discards its connection, and recovers without a duplicate', integration, async () => {
  const store = await TicketStore.create({ variant: 'reference' });
  const admin = await createAdminPool();
  const lock = await admin.connect();
  let lockReleased = false;
  const input = payload();
  try {
    await lock.query('BEGIN');
    await lock.query('LOCK TABLE lab_api.diagnostic_reports IN ACCESS EXCLUSIVE MODE');
    const start = performance.now();
    const failed = await store.createDiagnosticReport(input);
    const elapsed = performance.now() - start;
    errorCode(failed, 'TIMEOUT');
    if (!failed.ok) assert.equal(failed.error.retryable, true);
    assert.ok(elapsed >= 2500 && elapsed < 5500, `Expected bounded statement timeout; elapsed ${elapsed}ms.`);
    assert.equal(store.poolState().reporterTotal, 0);
    assert.equal(store.poolState().waiting, 0);
    await lock.query('ROLLBACK');
    lock.release();
    lockReleased = true;
    assert.equal(await reportCount(admin, input.idempotencyKey), 0);
    const recovered = value(await store.createDiagnosticReport(input));
    assert.equal(recovered.replayed, false);
    assert.equal(await reportCount(admin, input.idempotencyKey), 1);
  } finally {
    if (!lockReleased) {
      try { await lock.query('ROLLBACK'); } catch { /* lock backend lost */ }
      lock.release();
    }
    await store.close(); await admin.end();
  }
});

test('E10 an unavailable connection returns a bounded retryable error and closes cleanly', integration, async () => {
  // Reserve a loopback endpoint that immediately closes connections; no other
  // process or database is stopped, contacted or modified by this outage fixture.
  const endpoint = createServer(socket => socket.destroy());
  await new Promise<void>(resolveCall => endpoint.listen(0, '127.0.0.1', resolveCall));
  const address = endpoint.address(); assert.ok(address && typeof address === 'object');
  const config = await loadDbEnvironment();
  const store = await TicketStore.create({ variant: 'reference', config: { ...config, port: address.port } });
  try {
    const start = performance.now();
    const failed = await store.getTicket({ ticketId: 'LAB-101' });
    errorCode(failed, 'DATABASE_UNAVAILABLE');
    if (!failed.ok) assert.equal(failed.error.retryable, true);
    assert.ok(performance.now() - start < 3000);
    assert.equal(store.poolState().waiting, 0);
  } finally { await store.close(); await new Promise<void>(resolveCall => endpoint.close(() => resolveCall())); }
});

test('real MCP discovery has three tools and two resources; server schema rejects invalid input before DB work', async () => {
  const store = await TicketStore.create({ variant: 'reference', config: { host: '127.0.0.1', port: 65534, database: 'practice02', readerPassword: 'x', reporterPassword: 'x' } });
  const server = await createTicketServer({ store });
  const client = new Client({ name: 'practice02-db-protocol-test', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const tools = await client.listTools();
    assert.deepEqual(tools.tools.map(tool => tool.name).sort(), ['create_diagnostic_report', 'get_ticket', 'list_tickets']);
    assert.equal((await client.listResources()).resources.length, 2);
    const result = await client.callTool({ name: 'list_tickets', arguments: { limit: 999 } });
    assert.equal(result.isError, true);
    assert.deepEqual(store.poolState(), { readerTotal: 0, reporterTotal: 0, waiting: 0 });
  } finally { await client.close(); await server.close(); }
});
