import { spawn } from 'node:child_process';
import { LAB, entryError } from './common.js';
const selected=process.argv[2];
if(selected!=='reference' && selected!=='starter') {console.error('Use npm run verify:reference or npm run verify:student.');process.exit(2);}
async function run(args:string[],extra:Record<string,string>={}) {
  return new Promise<void>((resolve,reject)=>{
    const child=spawn(process.execPath,args,{cwd:LAB,stdio:'inherit',env:{...process.env,LAB_VARIANT:selected,LAB_DB_TESTS:'1',...extra}});
    child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(new Error('Verification step failed.')));
  });
}
try {
  await run(['node_modules/typescript/bin/tsc','--noEmit']);
  if(selected==='reference') await run(['--import','tsx','--test','tests/workspace.test.ts','tests/db.test.ts','tests/protocol.test.ts','tests/http.test.ts']);
  await run(['--import','tsx','scripts/security.ts',selected==='reference'?'--all':'--core']);
  await run(['--import','tsx','scripts/diagnosis.ts']);
  console.log(`VERIFY PASS (${selected}): types, executed boundaries, Docker roles, idempotency, and independent diagnosis.`);
} catch(error) {entryError(error);}
