import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { access } from 'node:fs/promises';
import { ROOT, save } from './evidence.mjs';
import { configuration } from '../ollama.mjs';
const practice = join(dirname(ROOT.replace(/\/$/, '')), 'practice-03');
const config = configuration();
// Explicit allowlist: no provider credential, proxy authorization or dotenv content crosses.
const env = {};
for (const name of ['PATH', 'HOME', 'USERPROFILE', 'TMPDIR', 'TMP', 'TEMP', 'SystemRoot', 'COMSPEC', 'PATHEXT']) if (process.env[name] !== undefined) env[name] = process.env[name];
env.OLLAMA_HOST = config.host; env.OLLAMA_MODEL = config.model;
try { await access(join(practice, 'package.json')); }
catch { console.error('PRACTICE_03_NOT_FOUND: place this folder beside practice-03 in the student repository.'); process.exit(1); }
const npmCLI = process.env.npm_execpath;
if (!npmCLI) { console.error('RUN_VIA_NPM: npm run verify:practice-03'); process.exit(1); }
const started = Date.now(); let output = ''; const command = ['--prefix', practice, 'run', 'verify:local'];
const code = await new Promise(resolve => {
  // Invoking npm's JavaScript entry point avoids shell quoting on Windows and Unix.
  const child = spawn(process.execPath, [npmCLI, ...command], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let finished = false;
  const finish = result => { if (finished) return; finished = true; clearTimeout(timer); resolve(result); };
  child.stdout.on('data', bytes => { const text = bytes.toString(); process.stdout.write(text); output = (output + text).slice(-64000); });
  child.stderr.on('data', bytes => { const text = bytes.toString(); process.stderr.write(text); output = (output + text).slice(-64000); });
  // 72 model calls * 60s maximum, plus evaluator/setup allowance. Each call is separately bounded.
  const timer = setTimeout(() => { child.kill('SIGTERM'); finish(124); }, 75 * 60000);
  child.on('error', error => { output += error.message; finish(1); }); child.on('close', code => finish(code ?? 1));
});
const path = await save('verify-practice-03', { status: code === 0 ? 'PASS' : 'FAIL', inference: true, model: config.model,
  maxCalls: 72, perActBudget: 24, providerKeysForwarded: false, elapsedMs: Date.now() - started, command: ['npm', ...command], exitCode: code, output });
console.log(`VERIFY_PRACTICE_03 ${code === 0 ? 'PASS' : 'FAIL'} inference=true evidence=${path}`);
process.exitCode = code;
