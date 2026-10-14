import { existsSync } from 'node:fs';
import { ROOT } from '../src/evaluator.js';
const [major,minor]=process.versions.node.split('.').map(Number);
const ok=(major>22||major===22&&minor>=12)&&existsSync(ROOT+'node_modules/tsx');
console.log(`DOCTOR ${ok?'PASS':'FAIL'} node=${process.versions.node} tsx=${existsSync(ROOT+'node_modules/tsx')?'installed':'missing'}`);
console.log('Offline: no inference, no cloud key. Local: Ollama qwen2.5:3b at loopback :11434. Cloud: explicit opt-in.');
process.exitCode=ok?0:1;
