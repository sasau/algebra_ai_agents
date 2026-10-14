import { inspect } from '../ollama.mjs';
import { save } from './evidence.mjs';
let evidence;
try {
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (!(major > 22 || major === 22 && minor >= 12)) throw new Error('NODE_22_12_OR_NEWER_REQUIRED');
  const result = await inspect(); evidence = { status: result.installed ? 'PASS' : 'FAIL', inference: false, node: process.versions.node, ...result };
  if (!result.installed) evidence.error = `MODEL_NOT_INSTALLED: run ollama pull ${result.model}`;
} catch (error) { evidence = { status: 'FAIL', inference: false, error: error.message }; }
const path = await save('doctor', evidence);
console.log(`DOCTOR ${evidence.status} inference=false server=${evidence.version ?? 'unavailable'} model=${evidence.model ?? 'unknown'} installed=${evidence.installed ?? false} evidence=${path}`);
if (evidence.error) console.log(evidence.error);
process.exitCode = evidence.status === 'PASS' ? 0 : 1;
