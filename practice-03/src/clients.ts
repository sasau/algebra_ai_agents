import type { Client, Message, Reply, ToolSpec, ChildReport } from './types.js';
import { solution } from './evaluator.js';
export class ScriptedClient implements Client {
  readonly kind='offline' as const; private id=0;
  constructor(readonly mode:'repair'|'failure'|'false-complete'='repair'){}
  async respond(messages:Message[], _tools:ToolSpec[]):Promise<Reply>{
    const next=(name:string,args:unknown):Reply=>({content:'Visible action: '+name,toolCalls:[{id:'fixture-'+(++this.id),name,arguments:args}],stop:'tool'});
    if(messages[0]?.content.includes('ROLE: explorer')){
      if(!messages.some(m=>m.role==='tool'))return next('read_file',{path:'src/slugify.ts'});
      const report:ChildReport={role:'explorer',summary:'The source replaces literal spaces only.',evidence:[{path:'src/slugify.ts',observation:'replace(/ /g, ...) leaves commas and exclamation marks in the slug.'}],recommendation:'Replace runs of non-ASCII letters/digits with one hyphen and strip edge hyphens.'};
      return {content:JSON.stringify(report),toolCalls:[],stop:'complete'};
    }
    if(messages[0]?.content.includes('ROLE: reflection'))return {content:'Lesson: the previous attempt did not satisfy trusted tests. Replace punctuation and whitespace runs, then verify the changed source.',toolCalls:[],stop:'complete'};
    if(this.mode==='false-complete')return {content:'All tests passed.',toolCalls:[],stop:'complete'};
    const calls=messages.flatMap(m=>m.toolCalls??[]).map(c=>c.name);
    if(_tools.some(tool=>tool.name==='delegate')&&!calls.includes('delegate'))return next('delegate',{role:'explorer',objective:'Inspect the slugify bug and recommend a bounded repair.',sourcePath:'src/slugify.ts',acceptance:['Hello, world! -> hello-world','Whitespace and punctuation collapse; digits survive; empty stays empty.'],maxTurns:3});
    if(!calls.includes('read_file'))return next('read_file',{path:'src/slugify.ts'});
    if(!calls.includes('edit_file'))return next('edit_file',{path:'src/slugify.ts',content:this.mode==='failure'?'export function slugify(value: string): string { return value.trim().toLowerCase().replace(/ /g, "-"); }\n':solution});
    if(!calls.includes('run_tests'))return next('run_tests',{});
    return {content:'The visible test result is available. The host must independently verify the saved source.',toolCalls:[],stop:'complete'};
  }
}
export type Transport=(url:string,init:RequestInit)=>Promise<Response>;
async function readJSON(response:Response):Promise<any>{
  if(!response.body)throw new Error('EMPTY_PROVIDER_BODY');
  const reader=response.body.getReader();let text='';let size=0;const decoder=new TextDecoder();
  try{while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>131072)throw new Error('PROVIDER_RESPONSE_TOO_LARGE');text+=decoder.decode(part.value,{stream:true});}text+=decoder.decode();return JSON.parse(text);}finally{await reader.cancel().catch(()=>{});}
}
async function boundedJSON(url:string,init:RequestInit,timeoutMs:number,transport:Transport):Promise<any>{
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>;
  try {
    const response=await Promise.race([transport(url,{...init,signal:controller.signal}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('PROVIDER_TIMEOUT'));},timeoutMs);})]);
    if(!response.ok)throw new Error('PROVIDER_HTTP_'+response.status);
    return await Promise.race([readJSON(response),new Promise<never>((_,reject)=>{setTimeout(()=>reject(new Error('PROVIDER_BODY_TIMEOUT')),timeoutMs).unref();})]);
  }finally{clearTimeout(timer!);controller.abort();}
}
function localMessages(messages:Message[]) {return messages.map(m=>({role:m.role,content:m.content,...(m.toolCallId?{tool_call_id:m.toolCallId,tool_name:messages.flatMap(x=>x.toolCalls??[]).find(c=>c.id===m.toolCallId)?.name}:{}),...(m.toolCalls?.length?{tool_calls:m.toolCalls.map(c=>({id:c.id,type:'function',function:{name:c.name,arguments:c.arguments}}))}:{})}));}
export class OllamaClient implements Client {
  readonly kind='local' as const;private id=0;readonly host:string;
  constructor(readonly model=process.env.OLLAMA_MODEL??'qwen2.5:3b',host=process.env.OLLAMA_HOST??'http://127.0.0.1:11434',readonly transport:Transport=fetch,readonly timeoutMs=60000){
    const u=new URL(host);if(u.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(u.hostname)||u.username||u.password||u.search||u.hash||u.pathname!=='/')throw new Error('LOCAL_HOST_MUST_BE_LOOPBACK_HTTP');this.host=u.origin;
  }
  async respond(messages:Message[],tools:ToolSpec[]):Promise<Reply>{
    const body=await boundedJSON(this.host+'/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model:this.model,messages:localMessages(messages),tools:tools.map(t=>({type:'function',function:t})),stream:false,think:false,options:{temperature:0,num_ctx:8192,num_predict:2048}})},this.timeoutMs,this.transport);
    if(body.done_reason==='length')return {content:'',toolCalls:[],stop:'truncated'};
    if(!body.message||typeof body.message.content!=='string')throw new Error('INVALID_LOCAL_RESPONSE');
    const calls=(body.message.tool_calls??[]).map((c:any)=>({id:c.id??'ollama-'+(++this.id),name:c.function?.name,arguments:c.function?.arguments}));
    return {content:body.message.content,toolCalls:calls,stop:calls.length?'tool':'complete'};
  }
}
export class CloudClient implements Client {
  readonly kind='cloud' as const;
  constructor(private readonly key:string,readonly transport:Transport=fetch,readonly timeoutMs=30000,readonly model=process.env.CLOUD_MODEL??'claude-haiku-4-5-20251001'){if(!key)throw new Error('CLOUD_CREDENTIAL_REQUIRED');}
  async respond(messages:Message[],tools:ToolSpec[]):Promise<Reply>{
    const system=messages.filter(m=>m.role==='system').map(m=>m.content).join('\n');
    const converted=messages.filter(m=>m.role!=='system').map(m=>m.role==='tool'?{role:'user',content:[{type:'tool_result',tool_use_id:m.toolCallId,content:m.content}]}:m.role==='assistant'?{role:'assistant',content:[...(m.content?[{type:'text',text:m.content}]:[]),...(m.toolCalls??[]).map(c=>({type:'tool_use',id:c.id,name:c.name,input:c.arguments}))]}:{role:'user',content:m.content});
    const body=await boundedJSON('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','anthropic-version':'2023-06-01','x-api-key':this.key},body:JSON.stringify({model:this.model,max_tokens:2048,system,messages:converted,tools:tools.map(t=>({name:t.name,description:t.description,input_schema:t.parameters}))})},this.timeoutMs,this.transport);
    if(body.stop_reason==='max_tokens')return {content:'',toolCalls:[],stop:'truncated'};
    if(!Array.isArray(body.content))throw new Error('INVALID_CLOUD_RESPONSE');
    const calls=body.content.filter((x:any)=>x.type==='tool_use').map((x:any)=>({id:x.id,name:x.name,arguments:x.input}));
    return {content:body.content.filter((x:any)=>x.type==='text').map((x:any)=>x.text).join('\n'),toolCalls:calls,stop:calls.length?'tool':'complete'};
  }
}
export function clientFor(kind:string):Client {if(kind==='offline')return new ScriptedClient();if(kind==='local')return new OllamaClient();throw new Error('Cloud requires explicit verify:cloud -- --run-cloud route');}
