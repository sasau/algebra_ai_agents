import { mkdtemp, mkdir, readFile, writeFile, lstat, realpath, rm } from 'node:fs/promises';
import { join, resolve, relative, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { originalSource, ROOT, evaluateSource } from './evaluator.js';
export class Workspace {
  constructor(readonly root: string) {}
  static async create(): Promise<Workspace> {
    const dir=await mkdtemp(join(tmpdir(),'p03-work-'));
    await mkdir(join(dir,'src'));await mkdir(join(dir,'test'));
    await writeFile(join(dir,'src/slugify.ts'),originalSource);
    await writeFile(join(dir,'test/slugify.test.ts'),await readFile(join(ROOT,'fixture/test/slugify.test.ts')));
    return new Workspace(dir);
  }
  async path(input: unknown, write=false): Promise<string> {
    if(typeof input!=='string' || !['src/slugify.ts','test/slugify.test.ts'].includes(input) || (write && input!=='src/slugify.ts'))throw new Error('PROTECTED_PATH: only src/slugify.ts is writable; source and supplied tests are readable');
    const candidate=resolve(this.root,input),rel=relative(this.root,candidate);
    if(rel.startsWith('..')||isAbsolute(rel))throw new Error('PATH_TRAVERSAL');
    const parts=input.split('/');let cur=this.root;
    for(const part of parts){cur=join(cur,part);if((await lstat(cur)).isSymbolicLink())throw new Error('SYMLINK_REJECTED');}
    const real=await realpath(candidate);if(!real.startsWith((await realpath(this.root))+'/'))throw new Error('PATH_ESCAPE');
    return candidate;
  }
  async read(path: unknown) { const text=await readFile(await this.path(path),'utf8');if(Buffer.byteLength(text)>16384)throw new Error('READ_LIMIT: maximum 16 KiB');return text; }
  async edit(path: unknown, content: unknown) {
    if(typeof content!=='string'||Buffer.byteLength(content)>16384)throw new Error('INVALID_CONTENT: string <=16 KiB required');
    await writeFile(await this.path(path,true),content);return 'Updated src/slugify.ts';
  }
  async evaluate(impossible=false) {return evaluateSource(await this.read('src/slugify.ts'), impossible);}
  async close(){await rm(this.root,{recursive:true,force:true});}
}
