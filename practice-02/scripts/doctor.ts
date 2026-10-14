import { execFileSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { LAB, variant } from './common.js';
import { Workspace } from '../src/core/workspace.js';
const [major, minor] = process.versions.node.split('.').map(Number);
const checks: Array<{item:string; state:string; detail:string}> = [];
checks.push({ item: 'Node', state: major! > 22 || (major === 22 && minor! >= 12) ? 'PASS' : 'FAIL', detail: process.version });
for (const command of ['claude', 'docker']) {
  try { checks.push({ item: command, state: 'PASS', detail: execFileSync(command, ['--version'], {encoding:'utf8',timeout:5000}).trim() }); }
  catch { checks.push({ item: command, state: 'MISSING', detail: 'Install this prerequisite before its lab phase.' }); }
}
try { execFileSync('docker', ['info','--format','{{.ServerVersion}}'], {encoding:'utf8',timeout:5000,stdio:['ignore','pipe','ignore']}); checks.push({item:'Docker engine',state:'PASS',detail:'Reachable'}); }
catch { checks.push({item:'Docker engine',state:'NOT READY',detail:'Start Docker Desktop or the configured local engine before Act 3.'}); }
let compose = false;
for (const [command,args] of [['docker',['compose','version']],['docker-compose',['version']]] as const) {
  try { execFileSync(command,[...args],{timeout:5000,stdio:'ignore'}); compose = true; break; } catch { /* try next supported form */ }
}
checks.push({item:'Compose',state:compose?'PASS':'MISSING',detail:'db:up supports docker compose and docker-compose.'});
for (const file of ['package-lock.json','fixture/manifest.json']) {
  try { await access(resolve(LAB,file)); checks.push({item:file,state:'PASS',detail:'Present'}); }
  catch { checks.push({item:file,state:'FAIL',detail:'Use the complete course lab folder.'}); }
}
const workspace = await Workspace.create();
const probe = await workspace.readFile({path:'src/tokenizer.ts'});
checks.push({item:'Student reader',state:probe.ok?'PASS':probe.error.code,detail:probe.ok?'Handler completed':probe.error.message});
checks.push({item:'Selected variant',state:'INFO',detail:variant()});
checks.push({item:'API key',state:'OPTIONAL',detail:process.env.ANTHROPIC_API_KEY?'Set; value intentionally omitted':'Not required by the core lab.'});
try { await readFile(resolve(LAB,'.env.local')); checks.push({item:'DB configuration',state:'PRESENT',detail:'Use db:probe to verify health and grants; file contents intentionally omitted.'}); }
catch { checks.push({item:'DB configuration',state:'PENDING',detail:'npm run db:up generates disposable local credentials.'}); }
console.table(checks);
console.log('Fixture expectation: one failing CRLF tokenizer test. Verification tests must pass; fixture:test is expected red.');
if (checks.some(check=>check.state==='FAIL')) process.exitCode=1;
