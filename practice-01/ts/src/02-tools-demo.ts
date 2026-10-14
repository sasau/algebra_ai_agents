/** Offline: instantiate the supplied tool harness before connecting it to a model. */
import { spawnSync } from 'node:child_process';
import { PRACTICE_ROOT } from './env.js';
import { runTool, useTarget } from './tools.js';
const prepared = spawnSync(process.execPath, ['scripts/prepare-run.mjs', 'tools-ts'], { cwd: PRACTICE_ROOT, encoding: 'utf8' });
if (prepared.status !== 0) throw new Error(prepared.stderr || 'could not prepare run');
useTarget(prepared.stdout.trim());
console.log(`Run directory: ${prepared.stdout.trim()}`);
const read = runTool('read_file', { path: 'src/parser.ts' });
console.log(`read_file(src/parser.ts): ${read.is_error ? 'ERROR' : 'OK'}`);
console.log(read.content.split('\n').slice(0, 4).join('\n'));
const blocked = runTool('write_file', { path: 'test/parser.test.ts', content: '// forbidden' });
console.log(`write_file(test/parser.test.ts): ${blocked.is_error ? 'REFUSED (expected)' : 'ERROR: allowed'}`);
const config = runTool('write_file', { path: 'package.json', content: '{}' });
console.log(`write_file(package.json): ${config.is_error ? 'REFUSED (expected)' : 'ERROR: allowed'}`);
const tests = runTool('run_tests', {});
console.log(tests.content);
if (read.is_error || !blocked.is_error || !config.is_error || tests.is_error || !tests.content.startsWith('exit code: 1\n') || !/unexpected token WHERE/.test(tests.content)) process.exit(1);
console.log('DEMO PASSED — tools work; the supplied WHERE test is intentionally red. No model was called.');
