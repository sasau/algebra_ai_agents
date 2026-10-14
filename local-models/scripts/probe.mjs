import { performance } from 'node:perf_hooks';
import { chat, configuration } from '../ollama.mjs';
import { save } from './evidence.mjs';
const messages = [
  { role: 'system', content: 'This is a native tool-request capability probe. Request exactly one read_file tool for src/slugify.ts. Do not answer with text, edit files, or claim that tests ran.' },
  { role: 'user', content: 'Inspect the supplied slugify source at src/slugify.ts. Begin by requesting read_file for that exact path.' }
];
const tools = [{ type: 'function', function: {
  name: 'read_file', description: 'Request the supplied source. This probe records the request; it does not execute a read.',
  parameters: { type: 'object', properties: { path: { type: 'string', enum: ['src/slugify.ts'] } }, required: ['path'], additionalProperties: false }
} }];
const start = performance.now(); let result;
try {
  const config = configuration(); const response = await chat({ messages, tools });
  const calls = response.message.tool_calls ?? [];
  const passed = calls.length === 1 && calls[0].function.name === 'read_file'
    && calls[0].function.arguments.path === 'src/slugify.ts' && Object.keys(calls[0].function.arguments).length === 1;
  result = { status: passed ? 'PASS' : 'FAIL', inference: true, calls: 1, model: config.model, host: config.host,
    elapsedMs: Math.round(performance.now() - start), claim: 'One native read_file request only; no repair or tool execution was tested.', messages, tools, response };
} catch (error) { result = { status: 'FAIL', inference: true, calls: 1, elapsedMs: Math.round(performance.now() - start), error: error.message }; }
const path = await save('probe', result);
console.log(`PROBE ${result.status} inference=true calls=1 model=${result.model ?? 'unknown'} elapsedMs=${result.elapsedMs} evidence=${path}`);
console.log('This measures one tool request. It does not establish slugify repair or delegation capability.');
process.exitCode = result.status === 'PASS' ? 0 : 1;
