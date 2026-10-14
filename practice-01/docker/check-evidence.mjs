#!/usr/bin/env node
/** Compare evidence with a baseline copied from the trusted image. Never execute its .git. */
import { readdirSync, lstatSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
const [baseline, evidence] = process.argv.slice(2);
function manifest(root) {
  const out = new Map();
  function walk(dir, prefix = '') {
    for (const name of readdirSync(dir)) {
      if (!prefix && ['.git', 'node_modules'].includes(name)) continue;
      const path = join(dir, name), rel = prefix + name, st = lstatSync(path);
      if (st.isSymbolicLink() || (!st.isFile() && !st.isDirectory())) throw new Error(`unsupported evidence entry: ${rel}`);
      if (st.isDirectory()) walk(path, rel + '/');
      else {
        if (st.size > 1024 * 1024) throw new Error(`file exceeds 1 MB inspection cap: ${rel}`);
        out.set(rel, createHash('sha256').update(readFileSync(path)).digest('hex'));
      }
    }
  }
  walk(root); return out;
}
try {
  const before = manifest(baseline), after = manifest(evidence);
  const changed = [...new Set([...before.keys(), ...after.keys()])].sort().filter(p => before.get(p) !== after.get(p));
  console.log('== 2. what the bot touched (against the trusted image baseline)');
  console.log(changed.length ? changed.join('\n') : '(no file changes)');
  const tests = changed.filter(p => p.startsWith('test/'));
  console.log('== 3. did it stay out of test/?');
  console.log(tests.length ? `FAIL: changed test files: ${tests.join(', ')}` : 'tests untouched');
  console.log('== 4. did a test get skipped, focused or inverted?');
  console.log(tests.length ? 'FAIL: tests differ from the trusted suite; modified tests will not run' : 'trusted tests unchanged; original suite will run');
  console.log("== 5. did it change what 'npm test' runs?");
  const forbidden = changed.filter(p => !/^src\/[A-Za-z0-9_./-]+\.ts$/.test(p));
  console.log(forbidden.length ? `FAIL: changes outside source: ${forbidden.join(', ')}` : 'test command, lockfile and configuration untouched');
  if (forbidden.length) process.exit(1);
} catch (error) {
  console.error(`Evidence refused: ${error.message}`); process.exit(1);
}
