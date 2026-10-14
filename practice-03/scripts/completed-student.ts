import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ROOT } from '../src/evaluator.js';
import { starterHashes } from '../src/disposable.js';
import { runAct, saveEvidence } from '../src/lab.js';
const before=await starterHashes();
const dir=await mkdtemp(join(tmpdir(),'p03-student-'));
try{
  // Only the implementation is copied. Fixture/workspace/evaluator remain supplied and trusted.
  await cp(join(ROOT,'starter'),join(dir,'starter'),{recursive:true});
  // Relative imports resolve to the supplied infrastructure; no starter is modified in place.
  await cp(join(ROOT,'src'),join(dir,'src'),{recursive:true});
  await cp(join(ROOT,'fixture'),join(dir,'fixture'),{recursive:true});
  await cp(join(ROOT,'trusted'),join(dir,'trusted'),{recursive:true});
  await writeFile(join(dir,'package.json'),'{"type":"module"}');
  const { symlink }=await import('node:fs/promises');await symlink(join(ROOT,'node_modules'),join(dir,'node_modules'),'dir');
  let markers=0;
  for(const [file,n] of [['react-agent.ts',1],['reflexion.ts',2],['delegate.ts',3]] as const){
    const target=join(dir,'starter',file),student=await readFile(target,'utf8'),reference=await readFile(join(ROOT,'reference',file),'utf8');
    // Construct from literal markers to avoid matching outside the exercise region.
    const begin=`// BEGIN TODO_ACT_${n}`,end=`// END TODO_ACT_${n}`;
    const body=reference.slice(reference.indexOf(begin),reference.indexOf(end)+end.length);
    if(!student.includes(begin)||!student.includes(end))throw new Error('MISSING_TODO_MARKER');
    await writeFile(target,student.slice(0,student.indexOf(begin))+body+student.slice(student.indexOf(end)+end.length));markers++;
  }
  const results=[];for(const act of [1,2,3])results.push(await runAct(act,'starter','offline',{root:dir,evidenceLabel:'completed-student'}));
  results.push(await runAct(2,'starter','offline',{root:dir,impossible:true,evidenceLabel:'completed-student'}));
  const after=await starterHashes(),starterUnchanged=JSON.stringify(before)===JSON.stringify(after);
  const passed=markers===3&&results.every(r=>r.passed)&&starterUnchanged;
  const path=await saveEvidence('verify-completed-student',{status:passed?'PASS':'FAIL',disposable:true,starterUnchanged,starterHashes:after,filledMarkers:markers,results:results.map(r=>({act:r.act,scenario:r.scenario,passed:r.passed,calls:r.calls,evidence:r.evidence}))});
  console.log(`VERIFY_COMPLETED_STUDENT ${passed?'PASS':'FAIL'} checks=${results.filter(r=>r.passed).length}/${results.length} filled=3 disposable=true evidence=${path}`);
  process.exitCode=passed?0:1;
}finally{await rm(dir,{recursive:true,force:true});}
