import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { check, config, request, validateChat, MAX_BYTES } from '../scripts/check.mjs';

const text = { done: true, done_reason: 'stop', message: { role: 'assistant', content: 'Hello.' } };
const tool = { done: true, message: { role: 'assistant', content: '', tool_calls: [
  { function: { name: 'read_file', arguments: { path: 'src/slugify.ts' } } }
] } };
const response = body => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
function fixture(overrides = {}) {
  const requests = [];
  const transport = async (url, init) => {
    const path = new URL(url).pathname;
    const body = init.body ? JSON.parse(init.body) : undefined;
    requests.push({ path, init, body });
    if (overrides[path]) return overrides[path](body);
    if (path === '/api/version') return response({ version: 'fixture' });
    if (path === '/api/tags') return response({ models: [{ name: 'qwen3.5:9b' }] });
    if (path === '/api/show') return response({ capabilities: ['completion', 'tools'] });
    if (path === '/api/chat') return response(body.tools ? tool : text);
    throw new Error('Unexpected route');
  };
  return { requests, transport };
}

test('doctor performs three metadata checks and zero model calls', async () => {
  const host = fixture();
  const result = await check('doctor', { transport: host.transport });
  assert.equal(result.status, 'PASS'); assert.equal(result.inference, false); assert.equal(result.calls, 0);
  assert.deepEqual(host.requests.map(item => item.path), ['/api/version', '/api/tags', '/api/show']);
});

test('smoke plans two bounded inference requests and never dispatches a tool', async () => {
  const host = fixture(); const result = await check('smoke', { transport: host.transport });
  assert.equal(result.status, 'PASS'); assert.equal(result.calls, 2);
  assert.equal(host.requests.length, 5);
  for (const item of host.requests.filter(item => item.path === '/api/chat')) {
    assert.equal(item.body.stream, false); assert.equal(item.body.think, false);
    assert.equal(item.body.options.num_ctx, 8192); assert.ok(item.body.options.num_predict <= 512);
  }
});

test('missing model stops before any inference', async () => {
  const host = fixture({ '/api/tags': () => response({ models: [] }) });
  const result = await check('smoke', { transport: host.transport });
  assert.equal(result.error, 'MODEL_NOT_INSTALLED'); assert.equal(result.calls, 0);
});

test('a cloud-proxy alias is rejected before any inference', async () => {
  const host = fixture({ '/api/show': () => response({ remote_host: 'https://ollama.com' }) });
  const result = await check('smoke', { transport: host.transport });
  assert.equal(result.error, 'CLOUD_PROXY_MODEL_REJECTED'); assert.equal(result.calls, 0);
});

test('remote hosts, credentials, paths and cloud tags cannot enter the local route', () => {
  for (const host of ['https://127.0.0.1:11434', 'http://example.org:11434', 'http://user:secret@localhost', 'http://localhost/api', 'http://localhost/?key=x']) {
    assert.throws(() => config({ host }), /LOCAL_ENDPOINT_REQUIRED/);
  }
  for (const model of ['', 'qwen:cloud', 'gpt-oss:120b-cloud']) assert.throws(() => config({ model }), /LOCAL_MODEL_REQUIRED/);
});

test('HTTP redirects are disabled, including on loopback', async () => {
  await request('/api/version', undefined, { transport: async (_, init) => {
    assert.equal(init.redirect, 'error'); return response({ version: 'fixture' });
  } });
});

test('ambient dummy cloud credentials are absent from all local request headers and bodies', async () => {
  const names = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GROQ_API_KEY', 'GEMINI_API_KEY', 'OLLAMA_API_KEY'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  try {
    for (const name of names) process.env[name] = 'tutorial-dummy-secret';
    const host = fixture(); const result = await check('smoke', { transport: host.transport });
    assert.equal(result.status, 'PASS');
    for (const item of host.requests) {
      assert.ok(!JSON.stringify(item).includes('tutorial-dummy-secret'));
      assert.ok(!Object.keys(item.init.headers).some(key => /authorization|api.?key/i.test(key)));
    }
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
    }
  }
});

test('local requests also work without provider credentials', async () => {
  const names = ['ANTHROPIC_API_KEY', 'OPENAI_API_KEY', 'GROQ_API_KEY', 'GEMINI_API_KEY', 'OLLAMA_API_KEY'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  try {
    for (const name of names) delete process.env[name];
    const host = fixture(); assert.equal((await check('smoke', { transport: host.transport })).status, 'PASS');
  } finally {
    for (const name of names) if (previous[name] !== undefined) process.env[name] = previous[name];
  }
});

test('HTTP and provider failures are recorded as failures', async () => {
  for (const [reply, expected] of [[new Response('no', { status: 503 }), 'OLLAMA_HTTP_503'], [response({ error: 'bad model' }), 'OLLAMA_PROVIDER_ERROR']]) {
    const host = fixture({ '/api/version': () => reply });
    assert.equal((await check('doctor', { transport: host.transport })).error, expected);
  }
});

test('malformed metadata is not a successful readiness check', async () => {
  const host = fixture({ '/api/version': () => response({ version: '' }) });
  assert.equal((await check('doctor', { transport: host.transport })).error, 'INVALID_SERVER_VERSION');
});

test('a stalled response is bounded by a timeout', async () => {
  await assert.rejects(request('/api/version', undefined, { timeoutMs: 10, transport: () => new Promise(() => {}) }), /OLLAMA_TIMEOUT/);
});

test('a stalled response body is also bounded by the timeout', async () => {
  await assert.rejects(request('/api/version', undefined, { timeoutMs: 10,
    transport: async () => new Response(new ReadableStream({ start() {} })) }), /OLLAMA_TIMEOUT/);
});

test('oversized or malformed response bodies cannot pass', async () => {
  await assert.rejects(request('/api/version', undefined, { transport: async () => new Response('x'.repeat(MAX_BYTES + 1)) }), /RESPONSE_TOO_LARGE/);
  await assert.rejects(request('/api/version', undefined, { transport: async () => new Response('{') }), SyntaxError);
});

test('truncation and incomplete assistant responses fail', () => {
  assert.throws(() => validateChat({ ...text, done_reason: 'length' }), /TRUNCATED_RESPONSE/);
  assert.throws(() => validateChat({ ...text, done: false }), /INVALID_ASSISTANT_RESPONSE/);
});

test('text claiming a tool ran is not a tool-request success', () => {
  assert.throws(() => validateChat({ ...text, message: { role: 'assistant', content: 'I read the source.' } }, 'tool'), /EXPECTED_SINGLE_READ_FILE_REQUEST/);
});

test('multiple, unknown and invalid tool requests are rejected together', () => {
  const cases = [
    [tool.message.tool_calls[0], tool.message.tool_calls[0]],
    [{ function: { name: 'edit_file', arguments: { path: 'src/slugify.ts' } } }],
    [{ function: { name: 'read_file', arguments: { path: '../secret' } } }],
    [{ function: { name: 'read_file', arguments: { path: 'src/slugify.ts', extra: true } } }]
  ];
  for (const calls of cases) assert.throws(() => validateChat({ ...tool, message: { ...tool.message, tool_calls: calls } }, 'tool'), /EXPECTED_SINGLE_READ_FILE_REQUEST/);
});

test('the shipped curl payloads match the exercised single-turn contracts', async () => {
  const chat = JSON.parse(await readFile(new URL('../examples/chat.json', import.meta.url)));
  const probe = JSON.parse(await readFile(new URL('../examples/tool-request.json', import.meta.url)));
  assert.equal(chat.model, 'qwen3.5:9b'); assert.equal(probe.model, chat.model);
  assert.equal(probe.tools.length, 1); assert.equal(probe.tools[0].function.name, 'read_file');
  assert.deepEqual(probe.tools[0].function.parameters.required, ['path']);
  assert.equal(probe.tools[0].function.parameters.additionalProperties, false);
});
