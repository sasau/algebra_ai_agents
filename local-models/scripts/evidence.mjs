import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export async function save(name, value) {
  const dir = new URL('../evidence/', import.meta.url); await mkdir(dir, { recursive: true });
  const filename = `${name}-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}.json`;
  const text = JSON.stringify(value, null, 2) + '\n';
  await writeFile(new URL(filename, dir), text, { flag: 'wx' });
  await writeFile(new URL(name + '.json', dir), text);
  return 'evidence/' + filename;
}
