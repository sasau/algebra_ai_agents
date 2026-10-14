import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const LAB_DIRECTORY = fileURLToPath(new URL('../../', import.meta.url));
export const LOCAL_ENV_FILE = fileURLToPath(new URL('../../.env.local', import.meta.url));
const RUNTIME_KEYS = ['LAB_DB_PORT', 'LAB_DB_READER_PASSWORD', 'LAB_DB_REPORTER_PASSWORD'] as const;
const SETUP_KEYS = [...RUNTIME_KEYS, 'LAB_DB_ADMIN_PASSWORD'] as const;

export interface DbConnectionConfig {
  host: '127.0.0.1';
  port: number;
  database: 'practice02';
  readerPassword: string;
  reporterPassword: string;
}

/** This is data parsing, never shell sourcing. Ignore every key outside the DB allowlist.
 * No model API key is loaded, copied to process.env, logged, or passed to pg.
 */
async function loadAllowed(keys: readonly string[]): Promise<Record<string, string>> {
  const values: Record<string, string> = {};
  try {
    const info = await stat(LOCAL_ENV_FILE);
    if (!info.isFile() || info.size > 8192) throw new Error('Invalid local database configuration file.');
    const text = await readFile(LOCAL_ENV_FILE, 'utf8');
    for (const line of text.split(/\r?\n/u)) {
      if (!line.trim() || line.trimStart().startsWith('#')) continue;
      const match = /^([A-Z][A-Z0-9_]*)=([A-Za-z0-9_-]*)$/u.exec(line);
      if (match && keys.includes(match[1]!)) values[match[1]!] = match[2]!;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  for (const key of keys) if (process.env[key]) values[key] = process.env[key]!;
  return values;
}

function configFrom(values: Record<string, string>): DbConnectionConfig {
  const port = Number(values.LAB_DB_PORT ?? 55432);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('LAB_DB_PORT must be an integer from 1024 to 65535.');
  const readerPassword = values.LAB_DB_READER_PASSWORD ?? '';
  const reporterPassword = values.LAB_DB_REPORTER_PASSWORD ?? '';
  if (![readerPassword, reporterPassword].every(value => /^[A-Za-z0-9_-]{24,128}$/u.test(value))) {
    throw new Error('Database credentials are missing or malformed. Run npm run db:up.');
  }
  return { host: '127.0.0.1', port, database: 'practice02', readerPassword, reporterPassword };
}

export async function loadDbEnvironment(): Promise<DbConnectionConfig> {
  return configFrom(await loadAllowed(RUNTIME_KEYS));
}

/** Administrative credentials belong only to local setup, grants probes and test code. */
export async function loadProvisioningEnvironment(): Promise<DbConnectionConfig & { adminPassword: string }> {
  const values = await loadAllowed(SETUP_KEYS);
  const adminPassword = values.LAB_DB_ADMIN_PASSWORD ?? '';
  if (!/^[A-Za-z0-9_-]{24,128}$/u.test(adminPassword)) throw new Error('Setup credentials are missing. Run npm run db:up.');
  return { ...configFrom(values), adminPassword };
}

export async function dbChildEnvironment(): Promise<Record<string, string>> {
  const config = await loadDbEnvironment();
  return {
    LAB_DB_PORT: String(config.port),
    LAB_DB_READER_PASSWORD: config.readerPassword,
    LAB_DB_REPORTER_PASSWORD: config.reporterPassword,
  };
}
