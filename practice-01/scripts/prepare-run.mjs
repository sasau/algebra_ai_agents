#!/usr/bin/env node
/** Make a new disposable exercise directory. Never reset or overwrite a previous run. */
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
if (!['act1', 'act2-ts', 'act2-java', 'tools-ts', 'tools-java', 'act3'].includes(mode)) {
  console.error('Usage: node scripts/prepare-run.mjs act1|act2-ts|act2-java|tools-ts|tools-java|act3');
  process.exit(2);
}
const name = mode === 'act1' ? 'parser-java' : 'parser-ts';
const source = join(root, name);
const excluded = new Set(['node_modules', 'build', '.gradle', '.git', '.env', '.workflow-out.txt']);
function checkTree(dir) {
  for (const entry of readdirSync(dir)) {
    if (excluded.has(entry) || entry.startsWith('.env') || ['settings.local.json', 'CLAUDE.local.md'].includes(entry)) continue;
    const path = join(dir, entry);
    if (lstatSync(path).isSymbolicLink()) throw new Error(`baseline contains a symlink: ${path}`);
    if (lstatSync(path).isDirectory()) checkTree(path);
  }
}
checkTree(source);
if (mode !== 'act1' && mode !== 'act3' && !existsSync(join(source, 'node_modules', 'vitest'))) {
  console.error('Install the target first: cd parser-ts && npm ci');
  process.exit(1);
}
mkdirSync(join(root, '.runs'), { recursive: true });
const run = mkdtempSync(join(root, '.runs', `${mode}-`));
const target = join(run, name);
cpSync(source, target, { recursive: true, filter: path => { const name = path.split(/[\\/]/).at(-1); return !excluded.has(name) && !name.startsWith('.env') && !['settings.local.json', 'CLAUDE.local.md'].includes(name); } });
// Each run owns its dependencies too; source code cannot mutate another run's node_modules.
if (mode !== 'act1' && mode !== 'act3') cpSync(join(source, 'node_modules'), join(target, 'node_modules'), { recursive: true, dereference: false });
console.log(target);
