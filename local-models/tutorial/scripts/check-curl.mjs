import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateChat } from './check.mjs';

const folder = process.argv[2];
if (!folder) throw new Error('Usage: node scripts/check-curl.mjs evidence/<curl-run-folder>');
const load = async name => JSON.parse(await readFile(resolve(folder, name + '.json'), 'utf8'));
const version = await load('version');
const tags = await load('tags');
const show = await load('show');
if (typeof version.version !== 'string' || !version.version) throw new Error('INVALID_SERVER_VERSION');
if (!Array.isArray(tags.models) || !tags.models.some(model => model.name === 'qwen3.5:9b')) throw new Error('MODEL_NOT_INSTALLED');
if (show.remote_host || show.remote_model) throw new Error('CLOUD_PROXY_MODEL_REJECTED');
validateChat(await load('chat'));
validateChat(await load('tool'), 'tool');
console.log('CURL PASS inference=true calls=2; one greeting and one read_file request; no tools executed');
