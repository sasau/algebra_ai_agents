/** One bounded native Ollama call. No provider key or authorization configuration exists. */
export const DEFAULT_MODEL = 'qwen3.5:9b';
export const DEFAULT_HOST = 'http://127.0.0.1:11434';
export const MAX_BODY_BYTES = 131072;
export function loopbackHost(input = process.env.OLLAMA_HOST ?? DEFAULT_HOST) {
  const url = new URL(input);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
      || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('OLLAMA_HOST_MUST_BE_LOOPBACK_HTTP: use http://127.0.0.1:11434');
  }
  return url.origin;
}
export function configuration(options = {}) {
  const timeoutMs = options.timeoutMs ?? 60000;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 60000) throw new Error('INVALID_TIMEOUT: 1..60000 ms');
  const model = options.model ?? process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;
  if (typeof model !== 'string' || !model.trim() || model.length > 160) throw new Error('INVALID_MODEL');
  return { host: loopbackHost(options.host), model, timeoutMs, transport: options.transport ?? fetch };
}
async function readJSON(response) {
  if (!response.body) throw new Error('OLLAMA_EMPTY_BODY');
  const reader = response.body.getReader(); const decoder = new TextDecoder();
  let bytes = 0; let text = '';
  try {
    while (true) {
      const chunk = await reader.read(); if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BODY_BYTES) throw new Error('OLLAMA_RESPONSE_TOO_LARGE: limit 128 KiB');
      text += decoder.decode(chunk.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally { await reader.cancel().catch(() => {}); }
}
async function request(path, init, options = {}) {
  const config = configuration(options); const controller = new AbortController(); let timer;
  try {
    return await Promise.race([
      (async () => {
        const response = await config.transport(config.host + path, { ...init, signal: controller.signal });
        if (!response.ok) throw new Error('OLLAMA_HTTP_' + response.status);
        const body = await readJSON(response);
        if (body.error) throw new Error('OLLAMA_PROVIDER_ERROR: ' + String(body.error).slice(0, 300));
        return body;
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new Error('OLLAMA_TIMEOUT')); }, config.timeoutMs); })
    ]);
  } finally { clearTimeout(timer); controller.abort(); }
}
/** Native response is returned; caller must enforce tool policy, append history and dispatch. */
export async function chat({ messages, tools = [] }, options = {}) {
  if (!Array.isArray(messages) || messages.length < 1 || !Array.isArray(tools)) throw new Error('INVALID_CHAT_INPUT');
  const { model } = configuration(options);
  const body = await request('/api/chat', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages, tools, stream: false, think: false,
      options: { temperature: 0, num_ctx: 8192, num_predict: 2048 } })
  }, options);
  if (body.done_reason === 'length') throw new Error('OLLAMA_TRUNCATED');
  if (body.done !== true || body.message?.role !== 'assistant' || typeof body.message.content !== 'string') throw new Error('OLLAMA_INVALID_RESPONSE');
  if (body.message.tool_calls !== undefined && (!Array.isArray(body.message.tool_calls)
      || body.message.tool_calls.some(call => typeof call?.function?.name !== 'string' || !call.function.name
        || !call.function.arguments || typeof call.function.arguments !== 'object' || Array.isArray(call.function.arguments)))) {
    throw new Error('OLLAMA_INVALID_TOOL_REQUEST');
  }
  return body;
}
/** Health checks only: these GET routes perform no inference. */
export async function inspect(options = {}) {
  const config = configuration(options);
  const version = await request('/api/version', { method: 'GET' }, options);
  const tags = await request('/api/tags', { method: 'GET' }, options);
  const models = Array.isArray(tags.models) ? tags.models.map(model => model.name) : [];
  return { host: config.host, model: config.model, version: version.version, installed: models.includes(config.model), models };
}
