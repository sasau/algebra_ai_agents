import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { ROOT } from './evaluator.js';
import { Workspace } from './workspace.js';
import { Budget, Host, readTool, editTool, testTool, delegateTool, system, task } from './host.js';
import { ScriptedClient, clientFor } from './clients.js';
import type { Client, Message } from './types.js';
export type Implementation='starter'|'reference';
export async function loadImplementation(impl:Implementation,root=ROOT){
  return { ...(await import(pathToFileURL(join(root,impl,'react-agent.ts')).href)),...(await import(pathToFileURL(join(root,impl,'reflexion.ts')).href)),...(await import(pathToFileURL(join(root,impl,'delegate.ts')).href)) };
}
export async function saveEvidence(name:string,data:unknown){
  await mkdir(join(ROOT,'evidence'),{recursive:true});
  const actual=name+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8)+'.json';
  const body=JSON.stringify(data,null,2)+'\n';
  await writeFile(join(ROOT,'evidence',actual),body,{flag:'wx'});
  await writeFile(join(ROOT,'evidence',name+'.json'),body); // latest convenience copy; reports link to immutable actual
  return 'evidence/'+actual;
}
export async function runAct(act:number,impl:Implementation,kind:string,options:{client?:Client;impossible?:boolean;root?:string;evidenceLabel?:string}={}){
  const workspace=await Workspace.create(),budget=new Budget(24),histories:{kind:string;messages:Message[]}[]=[];
  const delegateReports:unknown[]=[];
  const name=`act-${act}-${options.evidenceLabel??impl}-${kind}${options.impossible?'-unsolvable':''}`;
  let evidence:Record<string,unknown>={act,implementation:impl,client:kind,inference:kind!=='offline',scenario:options.impossible?'unsolvable':'repair',budgetLimit:budget.limit};
  try{
    const code=await loadImplementation(impl,options.root),client=options.client??clientFor(kind);
    const run=async (ctx:any)=>{try{return await code.runReact(ctx);}finally{histories.push({kind:ctx.host.kind,messages:structuredClone(ctx.messages)});}};
    let result:unknown;
    if(act===1){const host=new Host(workspace,client,budget);result=await run({host,messages:[{role:'system',content:system},{role:'user',content:task}],maxTurns:7});}
    else if(act===2){result=await code.runReflexion({workspace,makeHost:(attempt:number)=>new Host(workspace,kind==='offline'?new ScriptedClient(attempt===1?'failure':'repair'):client,budget),run,maxAttempts:2,impossible:options.impossible});}
    else if(act===3){
      let parent:Host;
      parent=new Host(workspace,client,budget,[readTool,editTool,testTool,delegateTool],'parent',0,args=>code.makeDelegate({parent,run})(args));
      // One delegate instance enforces sequential operation for the full parent session.
      const childDelegate=code.makeDelegate({parent,run});
      const delegate=async(args:unknown)=>{const report=await childDelegate(args);delegateReports.push(report);return report;};
      parent=new Host(workspace,client,budget,[readTool,editTool,testTool,delegateTool],'parent',0,delegate);
      result=await run({host:parent,messages:[{role:'system',content:system+' Before editing, use delegate with role exactly "explorer" and sourcePath exactly "src/slugify.ts". Obtain a successful structured explorer report; correct a rejected brief rather than bypassing delegation. Its report is advice; you must verify the saved source.'},{role:'user',content:task}],maxTurns:8});
    }else throw new Error('INVALID_ACT');
    const evaluation=await workspace.evaluate(options.impossible);
    const protocolComplete=act===2?(options.impossible?(result as any).attempts===2:(result as any).passed===true):(result as any).status==='complete';
    const parentHistories=histories.filter(h=>h.kind==='parent');
    const allCalls=parentHistories.flatMap(h=>h.messages.flatMap(m=>m.toolCalls??[]));
    const hasRequiredTools=['read_file','edit_file','run_tests'].every(name=>allCalls.some(c=>c.name===name));
    const act2Trace=act!==2||kind!=='offline'||(parentHistories.length===2&&(result as any).lessons?.length===1&&parentHistories[0].messages.some(m=>m.role==='tool'&&m.content.includes('false'))&&parentHistories[1].messages[1].content.includes('Lesson:'));
    const delegateIndex=act===3?parentHistories[0]?.messages.findIndex(m=>m.role==='tool'&&allCalls.find(c=>c.id===m.toolCallId)?.name==='delegate')??-1:-1;
    const parentVerifiedAfterDelegate=act!==3||(delegateIndex>=0&&parentHistories[0].messages.slice(delegateIndex+1).some(m=>m.toolCalls?.some(c=>c.name==='run_tests')));
    const checkpoints={hasRequiredTools,protocolComplete,act2Trace,parentVerifiedAfterDelegate,structuredChildReturn:act!==3||delegateReports.length>0};
    const passed=Object.values(checkpoints).every(Boolean)&&(options.impossible?!evaluation.passed:evaluation.passed)&&protocolComplete&&(act!==3||delegateReports.length>0);
    const failedCheckpoint=Object.entries(checkpoints).find(([,ok])=>!ok)?.[0];
    const error=passed?undefined:act===3&&delegateReports.length===0?'MISSING_SUCCESSFUL_CHILD_REPORT':failedCheckpoint?'CHECKPOINT_FAILED: '+failedCheckpoint:'INDEPENDENT_SOURCE_CHECK_FAILED';
    evidence={...evidence,passed,...(error?{error}:{}),result,evaluation,calls:budget.used,budgetEvents:budget.events,histories,delegateReports,checkpoints};
  }catch(e){evidence={...evidence,passed:false,error:e instanceof Error?e.message:String(e),calls:budget.used,budgetEvents:budget.events,histories,evaluation:await workspace.evaluate(options.impossible)};}
  finally{await workspace.close();}
  const path=await saveEvidence(name,evidence);
  return {...evidence,evidence:path} as Record<string,unknown>&{passed:boolean;calls:number;evidence:string};
}
