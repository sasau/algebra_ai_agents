import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { resolve } from 'node:path';
import { LAB, variant } from './common.js';
import type { Result } from '../src/core/result.js';
export async function connect(server: 'workspace' | 'tickets', selectedVariant = variant()) {
  const client = new Client({ name: 'practice-02-verifier', version: '1.0.0' }, { capabilities: {} });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve(LAB, 'scripts/launch-server.mjs'), server], cwd: LAB,
    env: { PATH: process.env.PATH ?? '', LAB_VARIANT: selectedVariant, LAB_DB_PORT: process.env.LAB_DB_PORT ?? '55432' },
    stderr: 'pipe',
  });
  await client.connect(transport);
  return client;
}
export async function call<T = unknown>(client: Client, name: string, args: Record<string, unknown>): Promise<Result<T>> {
  const result = await client.callTool({ name, arguments: args });
  if (result.structuredContent) return result.structuredContent as unknown as Result<T>;
  const contents = result.content as Array<{type:string; text?:string}>;
  const text = contents.find(block => block.type === 'text')?.text;
  if (!text) throw new Error('Tool response has no structured or textual result.');
  return JSON.parse(text) as Result<T>;
}
