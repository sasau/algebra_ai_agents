// This trusted parent drops unrelated environment variables before starting a server.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const lab = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const entry = { workspace: 'workspace.ts', tickets: 'ticket-store.ts' }[process.argv[2]];
if (!entry) { console.error('Usage: node scripts/launch-server.mjs workspace|tickets'); process.exit(2); }
const env = Object.fromEntries(['PATH', 'SystemRoot', 'TEMP', 'TMP', 'TMPDIR', 'LANG']
  .filter(key => process.env[key] !== undefined).map(key => [key, process.env[key]]));
env.LAB_VARIANT = process.env.LAB_VARIANT === 'reference' ? 'reference' : 'starter';
env.LAB_DB_PORT = process.env.LAB_DB_PORT || '55432';
const child = spawn(process.execPath, ['--import', 'tsx', resolve(lab, 'src/servers', entry)],
  { cwd: lab, env, stdio: 'inherit' });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('error', () => { console.error('Server process could not start. Run npm ci.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
