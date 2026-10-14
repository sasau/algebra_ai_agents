import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, cpSync, rmSync, unlinkSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = mkdtempSync(join(tmpdir(), 'p01-verifier-tests-'));
after(() => rmSync(root, {recursive:true,force:true}));
const baseline = join(root,'baseline');
for(const dir of ['src','test']) mkdirSync(join(baseline,dir),{recursive:true});
for(const file of ['src/parser.ts','test/parser.test.ts','package.json','package-lock.json','vitest.config.ts']) writeFileSync(join(baseline,file),'BASELINE');
const checker=join(dirname(fileURLToPath(import.meta.url)),'check-evidence.mjs');
for(const [name,mutate,expected] of [
 ['unchanged',()=>{},0],
 ['sourcechange',p=>writeFileSync(join(p,'src/parser.ts'),'FIX'),0],
 ['sourcedelete',p=>unlinkSync(join(p,'src/parser.ts')),0],
 ['testchange',p=>writeFileSync(join(p,'test/parser.test.ts'),'CHEAT'),1],
 ['configchange',p=>writeFileSync(join(p,'package.json'),'CHEAT'),1],
 ['hiddenfile',p=>writeFileSync(join(p,'.env'),'FAKE'),1],
 ['symlink',p=>symlinkSync('/tmp/outside.ts',join(p,'src/link.ts')),1],
]) test(name,()=>{
 const evidence=join(root,name);cpSync(baseline,evidence,{recursive:true});mutate(evidence);
 const out=spawnSync(process.execPath,[checker,baseline,evidence],{encoding:'utf8'});
 assert.equal(out.status,expected,out.stdout+out.stderr);
});
