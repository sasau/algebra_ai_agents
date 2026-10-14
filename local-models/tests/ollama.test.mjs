import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chat, inspect, configuration, loopbackHost, DEFAULT_MODEL, MAX_BODY_BYTES } from '../ollama.mjs';
const messages = [{ role: 'user', content: 'Read src/slugify.ts.' }];
const tools = [{ type: 'function', function: { name: 'read_file', parameters: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] } } }];
const reply = () => ({ done: true, done_reason: 'stop', message: { role: 'assistant', content: '', tool_calls: [{ function: { name: 'read_file', arguments: { path: 'src/slugify.ts' } } }] } });
const transport = async () => Response.json(reply());

test('loopback HTTP is required and credential-bearing or remote hosts are rejected', () => {
 for (const host of ['http://example.com:11434', 'https://127.0.0.1:11434', 'http://secret@127.0.0.1:11434', 'http://127.0.0.1/path', 'http://127.0.0.1?key=secret', 'http://0.0.0.0:11434']) assert.throws(() => loopbackHost(host), /LOOPBACK_HTTP/);
 assert.equal(loopbackHost('http://localhost:11434'), 'http://localhost:11434');
 assert.equal(loopbackHost('http://[::1]:11434'), 'http://[::1]:11434');
});
test('one native call preserves valid tool request and bounded generation options', async () => {
 let calls = 0;
 const result = await chat({ messages, tools }, { model: DEFAULT_MODEL, transport: async (url, init) => {
   calls++; assert.equal(url, 'http://127.0.0.1:11434/api/chat'); const request = JSON.parse(init.body);
   assert.equal(request.stream, false); assert.equal(request.think, false); assert.equal(request.options.num_ctx, 8192); assert.equal(request.options.num_predict, 2048); assert.equal(request.options.temperature, 0); assert.deepEqual(request.tools, tools);
   return Response.json(reply());
 } });
 assert.equal(calls, 1); assert.equal(result.message.tool_calls[0].function.arguments.path, 'src/slugify.ts');
});
test('credential-present and credential-absent environments never add authorization or keys', async () => {
 const names = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY']; const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
 try {
  for (const present of [false, true]) {
   for (const name of names) if (present) process.env[name] = 'DUMMY_SENTINEL_NOT_A_REAL_KEY'; else delete process.env[name];
   await chat({ messages, tools }, { transport: async (url, init) => {
    const serialized = JSON.stringify({ url, headers: init.headers, body: init.body });
    assert.ok(!serialized.includes('DUMMY_SENTINEL')); assert.ok(!serialized.toLowerCase().includes('authorization')); assert.ok(!serialized.includes('x-api-key'));
    return Response.json(reply());
   } });
  }
 } finally { for (const name of names) if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name]; }
});
test('mock provider HTTP and native error failures propagate without retries', async () => {
 let calls = 0; await assert.rejects(chat({ messages }, { transport: async () => { calls++; return new Response('down', { status: 503 }); } }), /OLLAMA_HTTP_503/); assert.equal(calls, 1);
 await assert.rejects(chat({ messages }, { transport: async () => Response.json({ error: 'model unavailable' }) }), /OLLAMA_PROVIDER_ERROR/);
});
test('timeout bounds a transport that ignores abort', async () => {
 await assert.rejects(chat({ messages }, { timeoutMs: 10, transport: () => new Promise(() => {}) }), /OLLAMA_TIMEOUT/);
});
test('timeout includes a body that never completes', async () => {
 await assert.rejects(chat({ messages }, { timeoutMs: 10, transport: async () => new Response(new ReadableStream({ start() {} })) }), /OLLAMA_TIMEOUT/);
});
test('provider response body is limited to 128 KiB', async () => {
 await assert.rejects(chat({ messages }, { transport: async () => new Response('x'.repeat(MAX_BODY_BYTES + 1)) }), /RESPONSE_TOO_LARGE/);
});
test('truncated responses are explicit failures rather than successful completion', async () => {
 await assert.rejects(chat({ messages }, { transport: async () => Response.json({ ...reply(), done_reason: 'length' }) }), /OLLAMA_TRUNCATED/);
});
test('invalid native responses and malformed tool requests reject', async () => {
 for (const body of [{ done: false, message: reply().message }, { done: true, message: { role: 'assistant', content: 5 } }]) await assert.rejects(chat({ messages }, { transport: async () => Response.json(body) }), /INVALID_RESPONSE/);
 const bad = reply(); bad.message.tool_calls[0].function.arguments = 'not an object';
 await assert.rejects(chat({ messages }, { transport: async () => Response.json(bad) }), /INVALID_TOOL_REQUEST/);
});
test('native multiple tool requests are preserved for caller policy enforcement', async () => {
 const body = reply(); body.message.tool_calls.push({ function: { name: 'read_file', arguments: { path: 'test/slugify.test.ts' } } });
 const result = await chat({ messages, tools }, { transport: async () => Response.json(body) }); assert.equal(result.message.tool_calls.length, 2);
});
test('configuration rejects unbounded timeouts and malformed chat input', async () => {
 for (const timeoutMs of [Infinity, -1, 0, 60001]) assert.throws(() => configuration({ timeoutMs }), /INVALID_TIMEOUT/);
 await assert.rejects(chat({ messages: [], tools }, { transport }), /INVALID_CHAT_INPUT/);
});
test('doctor health uses only GET version and tags without inference', async () => {
 const paths = []; const result = await inspect({ model: DEFAULT_MODEL, transport: async (url, init) => { paths.push(url); assert.equal(init.method, 'GET'); return Response.json(url.endsWith('version') ? { version: 'mock-version' } : { models: [{ name: DEFAULT_MODEL }] }); } });
 assert.equal(result.installed, true); assert.deepEqual(paths.map(url => new URL(url).pathname), ['/api/version', '/api/tags']);
});
