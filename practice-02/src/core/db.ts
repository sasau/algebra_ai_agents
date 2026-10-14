import { createHash, randomUUID } from 'node:crypto';
import pg, { type PoolClient, type PoolConfig } from 'pg';
import { z } from 'zod';
import { loadDbEnvironment, type DbConnectionConfig } from './db-env.js';
import type { StoredDiagnosticReport, Ticket, TicketLookup } from './db-types.js';
import { lookupTicket as studentLookup } from '../student/04-ticket-query.js';
import { lookupTicket as referenceLookup } from '../reference/04-ticket-query.js';
import { fail, ok, type Result } from './result.js';

const { Pool } = pg;
export const DB_LIMITS = Object.freeze({ connectionMs: 2000, statementMs: 3000, rows: 50, resultBytes: 20_000, summaryBytes: 2000 });
const bytes = (value: unknown): number => Buffer.byteLength(JSON.stringify(value), 'utf8');
const boundedText = (max: number) => z.string().min(1).max(max).refine(value => Buffer.byteLength(value, 'utf8') <= max && !value.includes('\0'), 'Text exceeds the UTF-8 byte limit or contains NUL.');
// Quote-bearing IDs remain legal input for the parameter-binding exercise.
export const TicketIdSchema = boundedText(64);
export const GetTicketSchema = z.object({ ticketId: TicketIdSchema }).strict();
export const ListTicketsSchema = z.object({
  status: z.enum(['open', 'investigating', 'closed']).optional(),
  limit: z.number().int().min(1).max(DB_LIMITS.rows).optional(),
  cursor: z.string().max(256).regex(/^[A-Za-z0-9_-]+$/u).optional(),
}).strict();
export const CreateDiagnosticReportSchema = z.object({
  ticketId: TicketIdSchema,
  runId: z.uuid(),
  summary: boundedText(DB_LIMITS.summaryBytes),
  evidenceDigest: z.string().regex(/^[a-f0-9]{64}$/u),
  idempotencyKey: z.string().min(8).max(128).regex(/^[A-Za-z0-9_-]+$/u),
}).strict();
export type DiagnosticReportInput = z.infer<typeof CreateDiagnosticReportSchema>;
export interface ReportReceipt { reportId: string; replayed: boolean; }
export interface TicketPage {
  tickets: Array<Pick<Ticket, 'ticketId' | 'title' | 'status'> & { truncated: boolean }>;
  nextCursor: string | null;
  truncated: boolean;
}
export interface TicketStoreOptions { variant?: 'starter' | 'reference'; config?: DbConnectionConfig; }

/** Explicit key order makes the same logical payload hash identically after a restart. */
export function canonicalReportPayloadHash(input: DiagnosticReportInput): string {
  return createHash('sha256').update(JSON.stringify({
    evidenceDigest: input.evidenceDigest, runId: input.runId, summary: input.summary, ticketId: input.ticketId,
  }), 'utf8').digest('hex');
}

export function restrictedPoolConfig(config: DbConnectionConfig, role: 'reader' | 'reporter'): PoolConfig {
  return {
    host: config.host, port: config.port, database: config.database,
    user: role === 'reader' ? 'lab_reader' : 'lab_reporter',
    password: role === 'reader' ? config.readerPassword : config.reporterPassword,
    ssl: false, max: 2, connectionTimeoutMillis: DB_LIMITS.connectionMs,
    statement_timeout: DB_LIMITS.statementMs, query_timeout: DB_LIMITS.statementMs + 500,
    idle_in_transaction_session_timeout: 4000, idleTimeoutMillis: 1000,
    allowExitOnIdle: true, application_name: `practice02-${role}`,
  };
}

export function databaseFailure(error: unknown): Result<never> {
  const code = (error as { code?: string })?.code;
  if (code === '57014' || (error as Error)?.message?.includes('Query read timeout')) {
    return fail('TIMEOUT', 'Database statement exceeded the three-second limit; its connection was discarded.', true);
  }
  if (code === '42501') return fail('FORBIDDEN', 'The database role does not permit this operation.');
  return fail('DATABASE_UNAVAILABLE', 'Database operation failed. Confirm the lab backend is healthy, then retry with the same idempotency key.', true);
}

function validConfig(config: DbConnectionConfig): boolean {
  return config.host === '127.0.0.1' && config.database === 'practice02'
    && Number.isInteger(config.port) && config.port >= 1024 && config.port <= 65535;
}

function encodeCursor(ticketId: string): string {
  return Buffer.from(JSON.stringify({ v: 1, after: ticketId }), 'utf8').toString('base64url');
}
function decodeCursor(cursor?: string): string | null {
  if (!cursor) return null;
  const value: unknown = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  const parsed = z.object({ v: z.literal(1), after: TicketIdSchema }).strict().safeParse(value);
  if (!parsed.success) throw new Error('Invalid cursor.');
  // Reject alternate encodings; cursors are pagination positions, never authority.
  if (encodeCursor(parsed.data.after) !== cursor) throw new Error('Invalid cursor.');
  return parsed.data.after;
}

const REPORT_PROJECTION = `report_id AS "reportId", ticket_id AS "ticketId", run_id AS "runId",
  summary, evidence_digest AS "evidenceDigest", idempotency_key AS "idempotencyKey",
  created_at::text AS "createdAt"`;

export class TicketStore {
  private readonly reader: InstanceType<typeof Pool>;
  private readonly reporter: InstanceType<typeof Pool>;
  private readonly lookup: TicketLookup;
  private closed = false;

  private constructor(config: DbConnectionConfig, variant: 'starter' | 'reference') {
    this.reader = new Pool(restrictedPoolConfig(config, 'reader'));
    this.reporter = new Pool(restrictedPoolConfig(config, 'reporter'));
    // An idle backend failure must not turn into an unhandled EventEmitter error.
    // Connection details and raw PostgreSQL messages are deliberately not printed.
    this.reader.on('error', () => process.stderr.write('ticket-store: idle reader connection lost\n'));
    this.reporter.on('error', () => process.stderr.write('ticket-store: idle reporter connection lost\n'));
    this.lookup = variant === 'reference' ? referenceLookup : studentLookup;
  }

  static async create(options: TicketStoreOptions = {}): Promise<TicketStore> {
    const config = options.config ?? await loadDbEnvironment();
    if (!validConfig(config)) throw new Error('Only the fixed loopback Practice 02 database may be connected.');
    const variant = options.variant ?? (process.env.LAB_VARIANT === 'reference' ? 'reference' : 'starter');
    return new TicketStore(config, variant);
  }

  private async withClient<T>(role: 'reader' | 'reporter', action: (client: PoolClient) => Promise<Result<T>>): Promise<Result<T>> {
    if (this.closed) return fail('DATABASE_UNAVAILABLE', 'This ticket-store connection has been closed.', true);
    let client: PoolClient | undefined;
    let discard = false;
    try {
      client = await this[role].connect();
      const result = await action(client);
      if (result.ok && bytes(result) > DB_LIMITS.resultBytes) return fail('RESULT_TOO_LARGE', 'Database result exceeded the 20,000-byte result budget.');
      return result;
    } catch (error) {
      discard = true;
      return databaseFailure(error);
    } finally { client?.release(discard); }
  }

  async getTicket(input: unknown): Promise<Result<Ticket>> {
    const parsed = GetTicketSchema.safeParse(input);
    if (!parsed.success) return fail('INVALID_INPUT', 'ticketId must be 1–64 UTF-8 bytes; no extra fields are accepted.');
    return this.withClient('reader', async client => {
      const result = await this.lookup(client, parsed.data.ticketId);
      if (!result.ok) return result;
      return result.value ? ok(result.value) : fail('NOT_FOUND', 'No ticket with this ID exists in the permitted project.');
    });
  }

  async listTickets(input: unknown = {}): Promise<Result<TicketPage>> {
    const parsed = ListTicketsSchema.safeParse(input);
    if (!parsed.success) return fail('INVALID_INPUT', 'Use an allowed status, limit 1–50, and a bounded cursor; no project or SQL argument is accepted.');
    let after: string | null;
    try { after = decodeCursor(parsed.data.cursor); }
    catch { return fail('INVALID_INPUT', 'The pagination cursor is malformed.'); }
    const limit = parsed.data.limit ?? 20;
    return this.withClient('reader', async client => {
      const { rows } = await client.query<TicketPage['tickets'][number]>({
        name: 'lab-list-tickets-v1',
        text: `SELECT ticket_id AS "ticketId", left(title, 200) AS title, status,
          length(title) > 200 AS truncated FROM lab_api.tickets
          WHERE ($1::text IS NULL OR status = $1) AND ($2::text IS NULL OR ticket_id COLLATE "C" > $2 COLLATE "C")
          ORDER BY ticket_id COLLATE "C" LIMIT $3`,
        values: [parsed.data.status ?? null, after, limit],
      });
      const page: TicketPage = { tickets: [], nextCursor: null, truncated: false };
      for (const row of rows) {
        const candidate: TicketPage = { tickets: [...page.tickets, row], nextCursor: encodeCursor(row.ticketId), truncated: true };
        if (bytes(ok(candidate)) > DB_LIMITS.resultBytes) { page.truncated = true; break; }
        page.tickets.push(row);
      }
      const last = page.tickets.at(-1);
      page.nextCursor = last && (page.truncated || rows.length === limit) ? encodeCursor(last.ticketId) : null;
      return ok(page);
    });
  }

  async createDiagnosticReport(input: unknown): Promise<Result<ReportReceipt>> {
    const parsed = CreateDiagnosticReportSchema.safeParse(input);
    if (!parsed.success) return fail('INVALID_INPUT', 'Provide a bounded ticket ID, UUID run ID, summary of at most 2,000 UTF-8 bytes, lowercase SHA-256 digest, and key of 8–128 safe characters.');
    const payload = parsed.data;
    const hash = canonicalReportPayloadHash(payload);
    return this.withClient('reporter', async client => {
      await client.query('BEGIN');
      try {
        const ticket = await client.query({ text: 'SELECT ticket_id FROM lab_api.tickets WHERE ticket_id = $1 LIMIT 1', values: [payload.ticketId] });
        if (!ticket.rowCount) { await client.query('ROLLBACK'); return fail('NOT_FOUND', 'A report can refer only to an existing ticket in the permitted project.'); }
        const inserted = await client.query<{ reportId: string }>({
          text: `INSERT INTO lab_api.diagnostic_reports
            (report_id, project_id, ticket_id, run_id, summary, evidence_digest, idempotency_key, payload_hash)
            VALUES ($1, 'lab-a', $2, $3, $4, $5, $6, $7)
            ON CONFLICT (project_id, idempotency_key) DO NOTHING RETURNING report_id AS "reportId"`,
          values: [randomUUID(), payload.ticketId, payload.runId, payload.summary, payload.evidenceDigest, payload.idempotencyKey, hash],
        });
        let receipt: ReportReceipt;
        if (inserted.rows[0]) receipt = { reportId: inserted.rows[0].reportId, replayed: false };
        else {
          // A concurrent insert blocks at the unique constraint. READ COMMITTED sees
          // its committed row in this subsequent statement, including after restart.
          const existing = await client.query<{ reportId: string; payloadHash: string }>({
            text: `SELECT report_id AS "reportId", payload_hash AS "payloadHash" FROM lab_api.diagnostic_reports
              WHERE project_id = 'lab-a' AND idempotency_key = $1 LIMIT 1`, values: [payload.idempotencyKey],
          });
          if (!existing.rows[0] || existing.rows[0].payloadHash !== hash) {
            await client.query('ROLLBACK');
            return fail('IDEMPOTENCY_CONFLICT', 'This key already identifies a different report payload. Use a new key only for a new intended report.');
          }
          receipt = { reportId: existing.rows[0].reportId, replayed: true };
        }
        await client.query('COMMIT');
        return ok(receipt);
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch { /* withClient destroys this connection */ }
        throw error;
      }
    });
  }

  /** Read-back is used by the model-free verifier, not exposed as an additional MCP tool. */
  async getReportForVerification(input: { reportId: string }): Promise<Result<StoredDiagnosticReport>> {
    if (!z.uuid().safeParse(input.reportId).success) return fail('INVALID_INPUT', 'reportId must be a UUID.');
    return this.withClient('reader', async client => {
      const { rows } = await client.query<StoredDiagnosticReport>({
        text: `SELECT ${REPORT_PROJECTION} FROM lab_api.report_evidence WHERE report_id = $1 LIMIT 1`, values: [input.reportId],
      });
      return rows[0] ? ok(rows[0]) : fail('NOT_FOUND', 'No stored report with this ID exists in the permitted project.');
    });
  }

  async verifyStoredReport(input: { reportId: string; ticketId: string; runId: string; evidenceDigest: string }): Promise<Result<StoredDiagnosticReport>> {
    const report = await this.getReportForVerification(input);
    if (!report.ok) return report;
    if (report.value.ticketId !== input.ticketId || report.value.runId !== input.runId || report.value.evidenceDigest !== input.evidenceDigest) {
      return fail('EVIDENCE_MISMATCH', 'Stored report fields do not match the independently retrieved workspace report.');
    }
    return report;
  }

  /** A separate SELECT verifies persistence; no in-memory insert counter is used. */
  async countReportsForVerification(input: { idempotencyKey: string }): Promise<Result<{ count: number; reportId: string | null }>> {
    if (!CreateDiagnosticReportSchema.shape.idempotencyKey.safeParse(input.idempotencyKey).success) {
      return fail('INVALID_INPUT', 'idempotencyKey must have 8–128 safe characters.');
    }
    return this.withClient('reporter', async client => {
      const { rows } = await client.query<{ count: number; reportId: string | null }>({
        text: `SELECT count(*)::integer AS count, min(report_id::text) AS "reportId"
          FROM lab_api.diagnostic_reports WHERE project_id = 'lab-a' AND idempotency_key = $1`,
        values: [input.idempotencyKey],
      });
      return ok(rows[0]!);
    });
  }

  /** Fixed probes: tool callers cannot supply SQL. Each refusal is independently queried. */
  async inspectPermissions(): Promise<Result<{ checks: Array<{ role: string; operation: string; denied: boolean; sqlState: string | null }> }>> {
    const checks: Array<{ role: string; operation: string; denied: boolean; sqlState: string | null }> = [];
    const probes = [
      ['reader', 'private-table-read', 'SELECT secret FROM lab_private.canaries'],
      ['reader', 'base-table-read', 'SELECT ticket_id FROM lab_data.tickets'],
      ['reader', 'ticket-mutation', "UPDATE lab_api.tickets SET title = 'LAB_UNEXPECTED' WHERE ticket_id = 'LAB-101'"],
      ['reader', 'report-insert', 'INSERT INTO lab_api.diagnostic_reports DEFAULT VALUES'],
      ['reporter', 'ticket-mutation', "UPDATE lab_api.tickets SET title = 'LAB_UNEXPECTED' WHERE ticket_id = 'LAB-101'"],
      ['reporter', 'schema-create', 'CREATE TABLE public.lab_unexpected (id integer)'],
      ['reporter', 'private-table-read', 'SELECT secret FROM lab_private.canaries'],
      ['reporter', 'report-delete', "DELETE FROM lab_api.diagnostic_reports WHERE project_id = 'lab-a'"],
    ] as const;
    for (const [role, operation, statement] of probes) {
      const observed = await this.withClient(role, async client => {
        await client.query('BEGIN');
        try {
          await client.query(statement);
          await client.query('ROLLBACK');
          return ok({ role, operation, denied: false, sqlState: null });
        } catch (error) {
          await client.query('ROLLBACK');
          const code = (error as { code?: string }).code ?? null;
          return ok({ role, operation, denied: code === '42501', sqlState: code });
        }
      });
      if (!observed.ok) return observed;
      checks.push(observed.value);
    }
    return ok({ checks });
  }

  poolState(): { readerTotal: number; reporterTotal: number; waiting: number } {
    return { readerTotal: this.reader.totalCount, reporterTotal: this.reporter.totalCount, waiting: this.reader.waitingCount + this.reporter.waitingCount };
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    await Promise.all([this.reader.end(), this.reporter.end()]);
  }
}
