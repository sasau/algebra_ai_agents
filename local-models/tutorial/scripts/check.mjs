import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
export const MAX_BYTES = 131072;

export function config(options = {}) {
  const url = new URL(options.host ?? process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434');
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
      || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('LOCAL_ENDPOINT_REQUIRED');
  }
  const model = options.model ?? process.env.OLLAMA_MODEL ?? 'qwen3.5:9b';
  if (typeof model !== 'string' || !model.trim() || model.length > 160 || /(?:^|[-:])cloud(?:$|[-:])/i.test(model)) {
    throw new Error('LOCAL_MODEL_REQUIRED');
  }
  const timeoutMs = options.timeoutMs ?? 60000;
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1 || timeoutMs > 60000) throw new Error('INVALID_TIMEOUT');
  return { host: url.origin, model, timeoutMs, transport: options.transport ?? fetch };
}

export async function request(path, body, options = {}) {
  const settings = config(options);
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      (async () => {
        const response = await settings.transport(settings.host + path, {
          method: body === undefined ? 'GET' : 'POST',
          headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
          redirect: 'error'
        });
        if (!response.ok) throw new Error(`OLLAMA_HTTP_${response.status}`);
        if (!response.body) throw new Error('EMPTY_BODY');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let bytes = 0; let text = '';
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > MAX_BYTES) throw new Error('RESPONSE_TOO_LARGE');
            text += decoder.decode(value, { stream: true });
          }
          const result = JSON.parse(text + decoder.decode());
          if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('INVALID_RESPONSE');
          if (result.error) throw new Error('OLLAMA_PROVIDER_ERROR');
          return result;
        } finally { await reader.cancel().catch(() => {}); }
      })(),
      new Promise((_, reject) => {
        timer = setTimeout(() => { controller.abort(); reject(new Error('OLLAMA_TIMEOUT')); }, settings.timeoutMs);
      })
    ]);
  } finally { clearTimeout(timer); controller.abort(); }
}

export function validateChat(response, mode = 'chat') {
  if (response.done_reason === 'length') throw new Error('TRUNCATED_RESPONSE');
  if (response.done !== true || response.message?.role !== 'assistant'
      || typeof response.message.content !== 'string') throw new Error('INVALID_ASSISTANT_RESPONSE');
  const calls = response.message.tool_calls ?? [];
  if (!Array.isArray(calls)) throw new Error('INVALID_TOOL_REQUEST');
  if (mode === 'chat') {
    if (!response.message.content.trim() || calls.length) throw new Error('EXPECTED_TEXT_RESPONSE');
  } else {
    const call = calls[0]?.function;
    if (calls.length !== 1 || call?.name !== 'read_file' || !call.arguments
        || typeof call.arguments !== 'object' || Array.isArray(call.arguments)
        || call.arguments.path !== 'src/slugify.ts' || Object.keys(call.arguments).length !== 1) {
      throw new Error('EXPECTED_SINGLE_READ_FILE_REQUEST');
    }
  }
  return response;
}

export async function check(mode, options = {}) {
  if (!['doctor', 'smoke'].includes(mode)) throw new Error('MODE_MUST_BE_DOCTOR_OR_SMOKE');
  const settings = config(options);
  const result = { status: 'FAIL', mode, inference: false, calls: 0,
    host: settings.host, model: settings.model, started: new Date().toISOString() };
  const start = performance.now();
  try {
    const version = await request('/api/version', undefined, settings);
    if (typeof version.version !== 'string' || !version.version) throw new Error('INVALID_SERVER_VERSION');
    const tags = await request('/api/tags', undefined, settings);
    if (!Array.isArray(tags.models)) throw new Error('INVALID_MODEL_LIST');
    if (!tags.models.some(item => item.name === settings.model)) throw new Error('MODEL_NOT_INSTALLED');
    const show = await request('/api/show', { model: settings.model }, settings);
    if (show.remote_host || show.remote_model) throw new Error('CLOUD_PROXY_MODEL_REJECTED');
    result.server = version.version;
    result.details = show.details ?? {};
    result.capabilities = show.capabilities ?? [];
    result.installed = true;
    if (mode === 'smoke') {
      result.responses = {};
      for (const [filename, contract] of [['chat.json', 'chat'], ['tool-request.json', 'tool']]) {
        const payload = JSON.parse(await readFile(resolve(root, 'examples', filename), 'utf8'));
        payload.model = settings.model;
        result.calls += 1;
        result.inference = true;
        const response = await request('/api/chat', payload, settings);
        result.responses[contract] = response;
        validateChat(response, contract);
      }
    }
    result.status = 'PASS';
  } catch (error) { result.error = error.message; }
  result.elapsedMs = Math.round(performance.now() - start);
  result.claim = 'Readiness and two single-turn responses only. No tool dispatch, source repair or delegation.';
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let result;
  try { result = await check(process.argv[2]); }
  catch (error) { result = { status: 'FAIL', inference: false, calls: 0, error: error.message }; }
  const folder = resolve(root, 'evidence');
  await mkdir(folder, { recursive: true });
  const mode = ['doctor', 'smoke'].includes(process.argv[2]) ? process.argv[2] : 'invalid';
  const name = `${mode}-${new Date().toISOString().replaceAll(':', '-')}-${randomUUID().slice(0, 8)}.json`;
  await writeFile(resolve(folder, name), JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(`${String(process.argv[2] ?? 'CHECK').toUpperCase()} ${result.status} inference=${result.inference} calls=${result.calls} elapsedMs=${result.elapsedMs ?? 0} evidence=evidence/${name}`);
  if (result.error) console.error(result.error);
  process.exitCode = result.status === 'PASS' ? 0 : 1;
}
