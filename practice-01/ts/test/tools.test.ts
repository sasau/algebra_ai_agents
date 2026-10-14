import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runTool, useTarget } from '../src/tools.js';
const root = mkdtempSync(join(tmpdir(), 'p01-tools-test-'));
after(() => rmSync(root, { recursive: true, force: true }));
const target = join(root, 'target'); mkdirSync(join(target, 'src'), { recursive: true }); mkdirSync(join(target, 'test'));
writeFileSync(join(target, 'test/parser.test.ts'), '// specification');
writeFileSync(join(root, 'outside.ts'), 'PRIVATE');
writeFileSync(join(target, 'package.json'), '{"name":"trusted"}');
useTarget(target);
test('source write/read works while test/config writes and path escapes are refused', () => {
  assert.equal(runTool('write_file', {path:'src/parser.ts',content:'export {};'}).is_error, undefined);
  assert.equal(runTool('read_file', {path:'src/parser.ts'}).content, 'export {};');
  for (const path of ['test/parser.test.ts','package.json','../outside.ts','/etc/passwd','.env','node_modules/secret.ts']) {
    assert.equal(runTool('write_file', {path,content:'evil'}).is_error, true, path);
  }
  assert.equal(readFileSync(join(target,'test/parser.test.ts'),'utf8'),'// specification');
  assert.equal(readFileSync(join(target,'package.json'),'utf8'),'{"name":"trusted"}');
});
test('symlink escape is refused for reads and writes', () => {
  symlinkSync(join(root,'outside.ts'),join(target,'src/link.ts'));
  for(const name of ['read_file','write_file']) assert.equal(runTool(name,{path:'src/link.ts',content:'evil'}).is_error,true);
  assert.equal(readFileSync(join(root,'outside.ts'),'utf8'),'PRIVATE');
});
test('bad input and unknown tools return error observations', () => {
  for(const [name,input] of [['read_file',{path:42}],['write_file',{path:'src/a.ts',content:42}],['unknown',{}],['read_file',{path:'src/\u0000.ts'}]]) assert.equal(runTool(name as string,input).is_error,true);
});

test('dangling symlink cannot redirect a write outside the target', () => {
  symlinkSync(join(root,'not-created.ts'),join(target,'src/dangling.ts'));
  assert.equal(runTool('write_file',{path:'src/dangling.ts',content:'evil'}).is_error,true);
});
