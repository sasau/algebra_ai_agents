import assert from 'node:assert/strict';
import { startHttpDemo } from '../src/servers/http-demo.js';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';
import { evidence, entryError } from './common.js';
export async function checkHttp() {
  const demo=await startHttpDemo();
  try {
    const request=(extra:Record<string,string>)=>fetch(demo.url,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json, text/event-stream',...extra},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:LATEST_PROTOCOL_VERSION,capabilities:{},clientInfo:{name:'http-check',version:'1.0.0'}}})});
    const absent=await request({}); assert.equal(absent.status,401);
    const invalid=await request({Authorization:'Bearer not-the-demo-token'}); assert.equal(invalid.status,401);
    const origin=await request({Authorization:`Bearer ${demo.token}`,Origin:'https://attacker.invalid'}); assert.equal(origin.status,403);
    const valid=await request({Authorization:`Bearer ${demo.token}`}); assert.equal(valid.status,200);
    const result=await valid.json() as {result:{protocolVersion:string}};
    const findings={missingAuth:absent.status,invalidAuth:invalid.status,untrustedOrigin:origin.status,authenticatedInitialise:valid.status,protocolVersion:result.result.protocolVersion,tokenRecorded:false};
    await evidence('E12-http',findings); return findings;
  } finally { await demo.close(); }
}
if (process.argv[1]?.endsWith('http-check.ts')) {
  try { console.log(JSON.stringify(await checkHttp(),null,2)); } catch(error) {entryError(error);}
}
