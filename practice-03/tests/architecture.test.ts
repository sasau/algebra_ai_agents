import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, unlink, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { Host, Budget, readTool, editTool, testTool, assertHistory, validateReply, system, task } from '../src/host.js';
import { Workspace } from '../src/workspace.js';
import { evaluateSource, originalSource, solution } from '../src/evaluator.js';
import { ScriptedClient, OllamaClient, CloudClient, type Transport } from '../src/clients.js';
import { runReact } from '../reference/react-agent.js';
import { runReflexion } from '../reference/reflexion.js';
import { makeDelegate } from '../reference/delegate.js';
import { starterHashes, disposableImplementation } from '../src/disposable.js';
import type { Client, Message, Reply } from '../src/types.js';
const done:Reply={content:'Done',toolCalls:[],stop:'complete'};
function queue(replies:Reply[]):Client{return {kind:'offline',async respond(){const reply=replies.shift();if(!reply)throw new Error('QUEUE_EXHAUSTED');return reply;}};}
const call=(id:string,name:string,args:unknown):Reply=>({content:'Visible action',toolCalls:[{id,name,arguments:args}],stop:'tool'});
const messages=():Message[]=>[{role:'system',content:system},{role:'user',content:task}];
const brief={role:'explorer' as const,objective:'Inspect the punctuation failure.',sourcePath:'src/slugify.ts' as const,acceptance:['Hello, world! -> hello-world'],maxTurns:3};
const report={role:'explorer',summary:'Literal spaces only.',evidence:[{path:'src/slugify.ts',observation:'Punctuation remains.'}],recommendation:'Collapse separators.'};
async function workspaceTest(fn:(w:Workspace)=>Promise<void>){const w=await Workspace.create();try{await fn(w);}finally{await w.close();}}

test('assistant content and tool request precede the matching tool result',async()=>workspaceTest(async w=>{
 const seen:Message[][]=[];const client=queue([call('read-1','read_file',{path:'src/slugify.ts'}),done]);
 const host=new Host(w,{kind:'offline',async respond(m,t){seen.push(m);return client.respond(m,t);}}),m=messages();
 await runReact({host,messages:m,maxTurns:3});
 assert.equal(m[2].content,'Visible action');assert.equal(m[2].toolCalls?.[0].id,'read-1');assert.equal(m[3].toolCallId,'read-1');assert.equal(seen[1][3].role,'tool');assertHistory(m);
}));
test('history rejects orphan, missing and duplicate tool results',()=>{
 assert.throws(()=>assertHistory([{role:'tool',content:'x',toolCallId:'x'}]),/ORPHAN/);
 assert.throws(()=>assertHistory([{role:'assistant',content:'x',toolCalls:[{id:'x',name:'read_file',arguments:{}}]}]),/MISSING/);
 assert.throws(()=>assertHistory([{role:'assistant',content:'x',toolCalls:[{id:'x',name:'read_file',arguments:{}}]},{role:'tool',content:'x',toolCallId:'x'},{role:'tool',content:'x',toolCallId:'x'}]),/ORPHAN/);
});
test('multiple requests are all paired with explicit rejection and none executes',async()=>workspaceTest(async w=>{
 const reply=call('a','edit_file',{path:'src/slugify.ts',content:solution});reply.toolCalls.push({id:'b',name:'run_tests',arguments:{}});
 const m=messages();await runReact({host:new Host(w,queue([reply,done])),messages:m,maxTurns:2});
 assert.equal(await w.read('src/slugify.ts'),originalSource);assert.deepEqual(m.slice(3,5).map(x=>x.toolCallId),['a','b']);assert.ok(m.slice(3,5).every(x=>x.content.includes('SINGLE_TOOL_CONTRACT')));assertHistory(m);
}));
test('unknown tools and malformed arguments return observable errors',async()=>workspaceTest(async w=>{
 const h=new Host(w,new ScriptedClient());
 assert.match(await h.dispatch({id:'a',name:'shell',arguments:{command:'pwd'}}),/UNKNOWN_OR_FORBIDDEN/);
 assert.match(await h.dispatch({id:'b',name:'read_file',arguments:'src/slugify.ts'}),/INVALID_ARGUMENTS/);
 assert.match(await h.dispatch({id:'c',name:'run_tests',arguments:{extra:true}}),/unexpected field/);
 assert.match(await h.dispatch({id:'d',name:'edit_file',arguments:{path:'src/slugify.ts'}}),/INVALID_CONTENT/);
}));
test('writes reject protected tests, configs, absolute and traversal paths',async()=>workspaceTest(async w=>{
 for(const p of ['test/slugify.test.ts','package.json','../src/slugify.ts','/tmp/source.ts'])await assert.rejects(w.edit(p,solution),/PROTECTED_PATH/);
 assert.equal(await w.read('src/slugify.ts'),originalSource);
}));
test('symlink source cannot be read or edited',async()=>workspaceTest(async w=>{
 await unlink(join(w.root,'src/slugify.ts'));await symlink(join(w.root,'test/slugify.test.ts'),join(w.root,'src/slugify.ts'));
 await assert.rejects(w.edit('src/slugify.ts',solution),/SYMLINK/);await assert.rejects(w.read('src/slugify.ts'),/SYMLINK/);
}));
test('source read and edit sizes are bounded',async()=>workspaceTest(async w=>{
 await assert.rejects(w.edit('src/slugify.ts','x'.repeat(16385)),/INVALID_CONTENT/);
 await writeFile(join(w.root,'src/slugify.ts'),'x'.repeat(16385));await assert.rejects(w.read('src/slugify.ts'),/READ_LIMIT/);
}));
test('false completion claims do not establish source correctness',async()=>workspaceTest(async w=>{
 const result=await runReact({host:new Host(w,new ScriptedClient('false-complete')),messages:messages(),maxTurns:2});
 assert.equal(result.status,'complete');assert.equal((await w.evaluate()).passed,false);
}));
test('truncated, invalid and reused request ids reject before dispatch',()=>{
 assert.throws(()=>validateReply({...done,stop:'truncated'},[]),/TRUNCATED/);
 assert.throws(()=>validateReply({content:'x',toolCalls:null,stop:'complete'} as any,[]),/INVALID_RESPONSE/);
 assert.throws(()=>validateReply(call('x','read_file',{}),[{role:'assistant',content:'x',toolCalls:[{id:'x',name:'read_file',arguments:{}}]}]),/DUPLICATE/);
 assert.throws(()=>validateReply({...call('x','read_file',{}),stop:'complete'},[]),/STOP_REASON_MISMATCH/);
});
test('turn exhaustion stops and invalid limits reject',async()=>workspaceTest(async w=>{
 const r=await runReact({host:new Host(w,queue([call('x','read_file',{path:'src/slugify.ts'})])),messages:messages(),maxTurns:1});assert.equal(r.status,'limit');
 await assert.rejects(runReact({host:new Host(w,new ScriptedClient()),messages:messages(),maxTurns:Infinity}),/INVALID_TURN_LIMIT/);
}));
test('provider timeout is bounded even when transport ignores abort',async()=>{
 const c=new OllamaClient('test','http://127.0.0.1:11434',()=>new Promise(()=>{}),10);
 await assert.rejects(c.respond(messages(),[readTool]),/PROVIDER_TIMEOUT/);
});
test('HTTP provider failures are reported without tool dispatch',async()=>{
 const c=new OllamaClient('test','http://localhost:11434',async()=>new Response('down',{status:503}));await assert.rejects(c.respond(messages(),[]),/PROVIDER_HTTP_503/);
});
test('local rejects remote endpoints and credential-bearing host URLs',()=>{
 for(const host of ['https://api.anthropic.com','http://example.com','http://secret@127.0.0.1:11434','http://127.0.0.1:11434/path'])assert.throws(()=>new OllamaClient('x',host),/LOOPBACK/);
});
test('local request uses paired tool_name and never forwards cloud credentials',async()=>{
 const previous=process.env.ANTHROPIC_API_KEY;process.env.ANTHROPIC_API_KEY='DUMMY_SENTINEL_NOT_A_REAL_KEY';
 try{
  let captured='';const transport:Transport=async(url,init)=>{captured=JSON.stringify({url,headers:init.headers,body:JSON.parse(String(init.body))});return Response.json({message:{content:'done'},done_reason:'stop'});};
  const c=new OllamaClient('test','http://127.0.0.1:11434',transport);
  await c.respond([...messages(),{role:'assistant',content:'read',toolCalls:[{id:'a',name:'read_file',arguments:{path:'src/slugify.ts'}}]},{role:'tool',toolCallId:'a',content:'source'}],[readTool]);
  assert.ok(!captured.includes('DUMMY_SENTINEL'));assert.match(captured,/tool_name/);assert.match(captured,/read_file/);
 }finally{if(previous===undefined)delete process.env.ANTHROPIC_API_KEY;else process.env.ANTHROPIC_API_KEY=previous;}
});
test('offline runs with credentials absent and ignores dummy credentials when present',async()=>{
 const prev=process.env.ANTHROPIC_API_KEY;
 try{for(const value of [undefined,'DUMMY_SENTINEL_NOT_REAL']){if(value)process.env.ANTHROPIC_API_KEY=value;else delete process.env.ANTHROPIC_API_KEY;const r=await new ScriptedClient().respond(messages(),[]);assert.equal(r.toolCalls[0].name,'read_file');assert.ok(!JSON.stringify(r).includes('DUMMY_SENTINEL'));}}
 finally{if(prev===undefined)delete process.env.ANTHROPIC_API_KEY;else process.env.ANTHROPIC_API_KEY=prev;}
});
test('cloud requires a credential, uses only official endpoint and pairs tool use',async()=>{
 assert.throws(()=>new CloudClient(''),/CREDENTIAL_REQUIRED/);
 let body:any;const c=new CloudClient('DUMMY_SENTINEL',async(url,init)=>{assert.equal(url,'https://api.anthropic.com/v1/messages');assert.equal((init.headers as any)['x-api-key'],'DUMMY_SENTINEL');body=JSON.parse(String(init.body));return Response.json({content:[{type:'text',text:'done'}],stop_reason:'end_turn'});});
 await c.respond([...messages(),{role:'assistant',content:'read',toolCalls:[{id:'pair',name:'read_file',arguments:{path:'src/slugify.ts'}}]},{role:'tool',toolCallId:'pair',content:'source'}],[readTool]);
 assert.equal(body.messages[1].content[1].id,'pair');assert.equal(body.messages[2].content[0].tool_use_id,'pair');
});
test('cloud and local truncation remain explicit',async()=>{
 const cloud=new CloudClient('DUMMY',async()=>Response.json({stop_reason:'max_tokens',content:[]}));assert.equal((await cloud.respond(messages(),[])).stop,'truncated');
 const local=new OllamaClient('test','http://127.0.0.1:11434',async()=>Response.json({done_reason:'length',message:{content:''}}));assert.equal((await local.respond(messages(),[])).stop,'truncated');
});
test('parent, child and reflection consume the same overall call budget',async()=>workspaceTest(async w=>{
 const budget=new Budget(2),client=queue([done,done,done]);
 const parent=new Host(w,client,budget),child=new Host(w,client,budget,[readTool],'child',1);
 await parent.model(messages());await child.model(messages());await assert.rejects(parent.model(messages(),[],'reflection'),/BUDGET_EXHAUSTED/);
 assert.deepEqual(budget.events.map(e=>e.kind),['parent','child']);assert.equal(budget.used,2);
}));
test('failed attempt, feedback and changed retry preserve lessons but refresh histories',async()=>workspaceTest(async w=>{
 const budget=new Budget(16),histories:Message[][]=[];
 const r=await runReflexion({workspace:w,makeHost:n=>new Host(w,new ScriptedClient(n===1?'failure':'repair'),budget),run:async c=>{histories.push(c.messages);return runReact(c);},maxAttempts:2});
 assert.equal(r.passed,true);assert.equal(r.attempts,2);assert.equal(r.lessons.length,1);assert.equal(budget.used,9);
 assert.match(histories[1][1].content,/Lesson:/);assert.notStrictEqual(histories[0],histories[1]);assert.ok(histories[0].some(m=>m.role==='tool'&&m.content.includes('"passed":false')));
}));
test('unsolvable evaluator exhausts exactly two attempts and stops',async()=>workspaceTest(async w=>{
 const budget=new Budget(16);const r=await runReflexion({workspace:w,makeHost:()=>new Host(w,new ScriptedClient(),budget),run:runReact,maxAttempts:2,impossible:true});
 assert.equal(r.passed,false);assert.equal(r.attempts,2);assert.equal(r.lessons.length,1);assert.match(r.evaluation.output,/UNSATISFIABLE/);assert.equal(budget.used,9);
}));
test('delegate child has fresh role context, complete brief and read-only tools',async()=>workspaceTest(async w=>{
 const budget=new Budget(8),parent=new Host(w,new ScriptedClient(),budget);
 const delegate=makeDelegate({parent,run:async c=>{
  assert.equal(c.host.depth,1);assert.equal(c.host.budget,budget);assert.deepEqual(c.host.tools.map(t=>t.name),['read_file']);assert.equal(c.messages.length,2);assert.match(c.messages[0].content,/ROLE: explorer/);assert.ok(!JSON.stringify(c.messages).includes('SECRET_PARENT_HISTORY'));assert.match(c.messages[1].content,/Hello, world!/);
  assert.match(await c.host.dispatch({id:'x',name:'edit_file',arguments:{path:'src/slugify.ts',content:solution}}),/FORBIDDEN/);
  c.messages.push({role:'assistant',content:JSON.stringify(report),toolCalls:[]});
 }});assert.equal((await delegate(brief)).role,'explorer');assert.equal(await w.read('src/slugify.ts'),originalSource);
}));
test('delegate rejects nested calls, invalid role, omitted and extra brief fields',async()=>workspaceTest(async w=>{
 const nested=makeDelegate({parent:new Host(w,new ScriptedClient(),new Budget(),[readTool],'child',1),run:runReact});await assert.rejects(nested(brief),/DEPTH_LIMIT/);
 const delegate=makeDelegate({parent:new Host(w,new ScriptedClient()),run:runReact});
 for(const b of [{...brief,role:'writer'},{...brief,acceptance:[]},{...brief,parentHistory:'secret'},{...brief,maxTurns:5},{...brief,objective:''}])await assert.rejects(delegate(b),/INVALID_CHILD_BRIEF/);
}));
test('delegate enforces sequential execution and validates structured return',async()=>workspaceTest(async w=>{
 let release!:()=>void;const pending=new Promise<void>(r=>release=r);
 const delegate=makeDelegate({parent:new Host(w,new ScriptedClient()),run:async c=>{await pending;c.messages.push({role:'assistant',content:JSON.stringify(report)});}});
 const first=delegate(brief);await assert.rejects(delegate(brief),/SEQUENTIAL/);release();await first;
 const bad=makeDelegate({parent:new Host(w,new ScriptedClient()),run:async c=>{c.messages.push({role:'assistant',content:'{"role":"writer"}'});}});await assert.rejects(bad(brief),/INVALID_CHILD_REPORT/);
}));
test('independent evaluator detects fixture failure and accepts all five completed checks',async()=>{
 assert.equal((await evaluateSource(originalSource)).passed,false);assert.equal((await evaluateSource(solution)).passed,true);
});
test('evaluation blocks source writes and child processes outside its read-only permission',async()=>{
 const write=`import {writeFileSync} from 'node:fs';writeFileSync('/private/tmp/p03-forbidden-write','bad');\n${solution}`;
 const child=`import {execSync} from 'node:child_process';execSync('echo forbidden');\n${solution}`;
 for(const source of [write,child]){const r=await evaluateSource(source);assert.equal(r.passed,false);assert.match(r.output,/ERR_ACCESS_DENIED|Access to this API has been restricted/);}
});
test('evaluation kills infinite loops and rejects early process exit completion',async()=>{
 const r=await evaluateSource(solution+'\nwhile(true){}');assert.equal(r.passed,false);assert.match(r.output,/EVALUATOR_TIMEOUT/);
 assert.equal((await evaluateSource(solution+'\nprocess.exit(0)')).passed,false);
});
test('student verification copies preserve the incomplete starter',async()=>{
 const before=await starterHashes(),copy=await disposableImplementation();try{await writeFile(join(copy.root,'starter/react-agent.ts'),'// disposable change');}finally{await copy.close();}assert.deepEqual(await starterHashes(),before);
});

test('oversized provider response and malformed local response fail explicitly',async()=>{
 const large=new OllamaClient('test','http://127.0.0.1:11434',async()=>new Response('x'.repeat(131073)));
 await assert.rejects(large.respond(messages(),[]),/PROVIDER_RESPONSE_TOO_LARGE/);
 const malformed=new OllamaClient('test','http://127.0.0.1:11434',async()=>Response.json({done_reason:'stop'}));
 await assert.rejects(malformed.respond(messages(),[]),/INVALID_LOCAL_RESPONSE/);
});
test('provider body timeout is bounded independently from successful headers',async()=>{
 const body=new ReadableStream({start(){}});
 const c=new OllamaClient('test','http://127.0.0.1:11434',async()=>new Response(body),15);
 await assert.rejects(c.respond(messages(),[]),/PROVIDER_TIMEOUT|PROVIDER_BODY_TIMEOUT/);
});

test('supplied child return validation rejects malformed, oversized and extra report fields', async()=>{
 const {validateChildReport}=await import('../src/delegation-contract.js');
 const final=(content:string):Message[]=>[{role:'assistant',content,toolCalls:[]}];
 for(const value of ['not-json','null','[]',JSON.stringify({...report,parentTranscript:'leak'}),JSON.stringify({...report,evidence:[{path:'src/slugify.ts',observation:'x',unexpected:true}]})]) {
  assert.throws(()=>validateChildReport(final(value)),/INVALID_CHILD_REPORT/);
 }
 assert.throws(()=>validateChildReport(final('x'.repeat(6001))),/CHILD_REPORT_TOO_LARGE/);
 assert.equal(validateChildReport(final(JSON.stringify(report))).role,'explorer');
});
