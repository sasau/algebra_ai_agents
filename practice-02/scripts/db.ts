import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { DB_LIMITS, TicketStore } from '../src/core/db.js';
import { LAB_DIRECTORY, LOCAL_ENV_FILE, loadProvisioningEnvironment } from '../src/core/db-env.js';
import { ok, type Result } from '../src/core/result.js';
import { createTicketServer } from '../src/servers/ticket-store.js';

const { Pool } = pg;
const COMPOSE_FILE = fileURLToPath(new URL('../docker/compose.yaml', import.meta.url));
const VOLUME = 'course-c-practice02-postgres';

/** Only generated key=value data is written; no dotenv evaluation or shell source. */
export async function ensureDbSecrets(): Promise<void> {
  let exists = false;
  try { await readFile(LOCAL_ENV_FILE, 'utf8'); exists = true; }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  const selectedPort = process.env.LAB_DB_PORT;
  if (selectedPort && (!/^\d{4,5}$/u.test(selectedPort) || Number(selectedPort) < 1024 || Number(selectedPort) > 65535)) {
    throw new Error('Invalid LAB_DB_PORT.');
  }
  if (!exists) {
    const password = () => randomBytes(32).toString('base64url');
    await writeFile(LOCAL_ENV_FILE, [
      '# Disposable local credentials. Never commit or print this file.',
      `LAB_DB_PORT=${selectedPort ?? '55432'}`,
      `LAB_DB_ADMIN_PASSWORD=${password()}`,
      `LAB_DB_READER_PASSWORD=${password()}`,
      `LAB_DB_REPORTER_PASSWORD=${password()}`,
      '',
    ].join('\n'), { mode: 0o600, flag: 'wx' });
  } else if (selectedPort) {
    const text = await readFile(LOCAL_ENV_FILE, 'utf8');
    const updated = /^LAB_DB_PORT=.*$/mu.test(text)
      ? text.replace(/^LAB_DB_PORT=.*$/mu, `LAB_DB_PORT=${selectedPort}`)
      : `${text.trimEnd()}\nLAB_DB_PORT=${selectedPort}\n`;
    await writeFile(LOCAL_ENV_FILE, updated, { mode: 0o600 });
  }
  await chmod(LOCAL_ENV_FILE, 0o600);
  // Validate generated or retained values without displaying them.
  await loadProvisioningEnvironment();
}

function composeExecutable(): { command: string; prefix: string[] } {
  const plugin = spawnSync('docker', ['compose', 'version'], { stdio: 'ignore', timeout: 5000 });
  if (plugin.status === 0) return { command: 'docker', prefix: ['compose'] };
  const standalone = spawnSync('docker-compose', ['version'], { stdio: 'ignore', timeout: 5000 });
  if (standalone.status === 0) return { command: 'docker-compose', prefix: [] };
  throw new Error('Install Docker Compose (docker compose or docker-compose).');
}

/** Compose output can contain database values in errors. Return only a safe status. */
async function runSafe(command: string, args: string[], timeoutMs: number): Promise<void> {
  await new Promise<void>((resolveCall, rejectCall) => {
    const child = spawn(command, args, { cwd: LAB_DIRECTORY, shell: false, stdio: 'ignore' });
    const timer = setTimeout(() => { child.kill('SIGKILL'); rejectCall(new Error('Lab Docker command exceeded its time limit.')); }, timeoutMs);
    child.once('error', () => { clearTimeout(timer); rejectCall(new Error('Lab Docker command could not start.')); });
    child.once('exit', code => { clearTimeout(timer); code === 0 ? resolveCall() : rejectCall(new Error('Lab Docker command failed. Check Docker, Compose, and the configured loopback port.')); });
  });
}

async function compose(args: string[], timeoutMs = 180_000): Promise<void> {
  const tool = composeExecutable();
  await runSafe(tool.command, [...tool.prefix, '--project-name', 'course-c-practice02', '--env-file', LOCAL_ENV_FILE, '--file', COMPOSE_FILE, ...args], timeoutMs);
}

export async function databaseUp(): Promise<void> {
  await ensureDbSecrets();
  await compose(['up', '--detach', '--wait', '--wait-timeout', '60']);
  const config = await loadProvisioningEnvironment();
  process.stdout.write(`Practice 02 PostgreSQL is healthy on 127.0.0.1:${config.port}; credentials remain in the ignored local file.\n`);
}

export async function databaseDown(): Promise<void> {
  await compose(['down', '--timeout', '5'], 30_000);
  process.stdout.write('Practice 02 services stopped; the named database volume and reports are retained.\n');
}

export async function databaseReset(confirmed: boolean): Promise<void> {
  if (!confirmed) throw new Error('Destructive reset requires --confirm-lab-reset. It erases only this lab volume and all its reports.');
  await compose(['down', '--timeout', '5'], 30_000);
  await runSafe('docker', ['volume', 'rm', VOLUME], 15_000);
  process.stdout.write('Only course-c-practice02-postgres was removed. All reports in that disposable lab volume were erased. Run db:up to recreate it.\n');
}

/** Independent SQL authority is deliberately confined to setup/verifier scripts. */
export async function createAdminPool(): Promise<InstanceType<typeof Pool>> {
  const config = await loadProvisioningEnvironment();
  const pool = new Pool({ host: config.host, port: config.port, database: config.database, user: 'lab_admin', password: config.adminPassword,
    max: 1, connectionTimeoutMillis: DB_LIMITS.connectionMs, statement_timeout: DB_LIMITS.statementMs,
    query_timeout: DB_LIMITS.statementMs + 500, idleTimeoutMillis: 1000, allowExitOnIdle: true });
  pool.on('error', () => process.stderr.write('db verifier: idle setup connection lost\n'));
  return pool;
}

function unwrap<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
}

export async function probeDatabase(): Promise<Result> {
  const store = await TicketStore.create({ variant: 'reference' });
  const server = await createTicketServer({ store });
  const client = new Client({ name: 'practice02-db-probe', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const discovery = await client.listTools();
    const mcpLookup = await client.callTool({ name: 'get_ticket', arguments: { ticketId: 'LAB-101' } });
    if (mcpLookup.isError) throw new Error('Reference MCP ticket lookup failed.');
    const ticket = unwrap(await store.getTicket({ ticketId: 'LAB-101' }));
    const scope = await store.getTicket({ ticketId: 'OTHER-201' });
    const quoted = await store.getTicket({ ticketId: "LAB-101' OR '1'='1" });
    const permissions = unwrap(await store.inspectPermissions());
    if (scope.ok || quoted.ok || !permissions.checks.every(check => check.denied)) throw new Error('A required database scope or role boundary failed.');
    return ok({ case: 'E05', transport: 'Real SDK client/server over linked in-memory transport; stdio is checked by mcp:inspect.',
      discoveredTools: discovery.tools.map(tool => tool.name), mcpLookup, ticketId: ticket.ticketId,
      quoteBearingLookup: quoted, otherProjectLookup: scope, permissions: permissions.checks });
  } finally { await client.close(); await server.close(); await store.close(); }
}

export async function verifyDatabase(): Promise<Result> {
  const idempotencyKey = `verify-${randomUUID()}`;
  const payload = { ticketId: 'LAB-101', runId: randomUUID(), summary: 'Model-free idempotency probe; this is not a verified diagnosis.',
    evidenceDigest: createHash('sha256').update('SYNTHETIC_IDEMPOTENCY_PROBE').digest('hex'), idempotencyKey };
  let store = await TicketStore.create({ variant: 'reference' });
  const admin = await createAdminPool();
  try {
    // Simulated network loss: commit completes, but the caller discards the receipt.
    unwrap(await store.createDiagnosticReport(payload));
    await store.close();
    store = await TicketStore.create({ variant: 'reference' });
    const retry = unwrap(await store.createDiagnosticReport(payload));
    const readBack = unwrap(await store.getReportForVerification({ reportId: retry.reportId }));
    const conflict = await store.createDiagnosticReport({ ...payload, summary: 'Changed payload with the same key.' });
    const count = await admin.query<{ count: number; reportId: string }>({ text:
      `SELECT count(*)::integer AS count, min(report_id::text) AS "reportId" FROM lab_api.diagnostic_reports
       WHERE project_id = 'lab-a' AND idempotency_key = $1`, values: [idempotencyKey] });
    if (!retry.replayed || count.rows[0]?.count !== 1 || count.rows[0].reportId !== retry.reportId
      || conflict.ok || conflict.error.code !== 'IDEMPOTENCY_CONFLICT' || readBack.runId !== payload.runId) {
      throw new Error('Durable idempotency verification failed.');
    }
    return ok({ case: 'E06', simulatedLoss: 'Discarded response after successful commit; recreated TicketStore before retry.',
      retry, conflict, independentSqlCount: count.rows[0].count, readBack });
  } finally { await store.close(); await admin.end(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const action = process.argv[2];
    if (action === 'up') await databaseUp();
    else if (action === 'down') await databaseDown();
    else if (action === 'reset') await databaseReset(process.argv.includes('--confirm-lab-reset'));
    else if (action === 'probe' || action === 'verify') {
      const result = action === 'probe' ? await probeDatabase() : await verifyDatabase();
      await mkdir(resolve(LAB_DIRECTORY, 'work/evidence'), { recursive: true });
      await writeFile(resolve(LAB_DIRECTORY, `work/evidence/db-${action}.json`), JSON.stringify({ capturedAt: new Date().toISOString(), result }, null, 2) + '\n');
      process.stdout.write(JSON.stringify(result, null, 2) + '\n');
      if (!result.ok) process.exitCode = 1;
    } else throw new Error('Use db.ts up|down|probe|verify|reset [--confirm-lab-reset].');
  } catch (error) {
    // Our own Error messages are safe; raw PostgreSQL/Docker errors are never printed.
    const message = error instanceof Error && !('severity' in error) && !('code' in error)
      ? error.message : 'Database command failed. Check the lab backend and local configuration.';
    process.stderr.write(message + '\n');
    process.exitCode = 1;
  }
}
