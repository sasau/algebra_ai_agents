import { mkdtemp, cp, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { ROOT } from './evaluator.js';
export async function starterHashes(){
  const pairs=await Promise.all(['react-agent.ts','reflexion.ts','delegate.ts'].map(async f=>[f,createHash('sha256').update(await readFile(join(ROOT,'starter',f))).digest('hex')]));
  return Object.fromEntries(pairs);
}
export async function disposableImplementation(){
  const root=await mkdtemp(join(tmpdir(),'p03-implementation-'));
  for(const dir of ['starter','src','fixture','trusted'])await cp(join(ROOT,dir),join(root,dir),{recursive:true});
  await cp(join(ROOT,'package.json'),join(root,'package.json'));
  await cp(join(ROOT,'tsconfig.json'),join(root,'tsconfig.json'));
  await symlink(join(ROOT,'node_modules'),join(root,'node_modules'),'dir');
  return {root,close:()=>rm(root,{recursive:true,force:true})};
}
