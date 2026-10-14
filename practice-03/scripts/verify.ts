import { runAct, saveEvidence } from '../src/lab.js';
import { disposableImplementation, starterHashes } from '../src/disposable.js';
import { CloudClient } from '../src/clients.js';
const mode=process.argv[2]??'offline';
if(mode==='cloud'&&(!process.argv.includes('--run-cloud')||!process.env.ANTHROPIC_API_KEY)){
  const reason=!process.argv.includes('--run-cloud')?'requires explicit --run-cloud':'ANTHROPIC_API_KEY is absent';
  const path=await saveEvidence('verify-cloud',{status:'SKIP',inference:false,reason});
  console.log(`VERIFY_CLOUD SKIP ${reason} evidence=${path}`);
}else{
  const impl=mode==='student'?'starter':'reference',kind=mode==='student'?'offline':mode;
  if(!['offline','local','cloud'].includes(kind))throw new Error('Unknown verification route');
  const before=await starterHashes();
  const disposable=impl==='starter'?await disposableImplementation():undefined;
  const results=[];
  for(const act of [1,2,3])results.push(await runAct(act,impl,kind,{client:kind==='cloud'?new CloudClient(process.env.ANTHROPIC_API_KEY!):undefined,root:disposable?.root}));
  if(kind==='offline')results.push(await runAct(2,impl,kind,{impossible:true,root:disposable?.root}));
  await disposable?.close();
  const after=await starterHashes();
  const starterUnchanged=JSON.stringify(before)===JSON.stringify(after);
  const passed=results.every(r=>r.passed)&&starterUnchanged;
  const path=await saveEvidence(`verify-${mode}`,{status:passed?'PASS':'FAIL',inference:kind!=='offline',disposable:impl==='starter',starterUnchanged,starterHashes:after,results:results.map(r=>({act:r.act,scenario:r.scenario,passed:r.passed,calls:r.calls,evidence:r.evidence,error:r.error}))});
  console.log(`VERIFY_${mode.toUpperCase()} ${passed?'PASS':'FAIL'} checks=${results.filter(r=>r.passed).length}/${results.length} calls=${results.reduce((n,r)=>n+r.calls,0)} evidence=${path}`);
  for(const r of results)if(!r.passed)console.log(`  Act ${r.act}: ${r.error??'independent source tests failed'} (${r.evidence})`);
  process.exitCode=passed?0:1;
}
