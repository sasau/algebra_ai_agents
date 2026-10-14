import test from 'node:test';
import assert from 'node:assert/strict';
import { RawRpc } from '../scripts/rpc.js';
import { connect,call } from '../scripts/client.js';

test('real stdio discovery and primitives; raw input errors differ from protocol errors',async()=>{
  const previous=process.env.LAB_VARIANT;process.env.LAB_VARIANT='reference';
  const rpc=new RawRpc('workspace');
  try {
    const initial=await rpc.initialise();assert.equal(initial.result.protocolVersion,'2025-11-25');
    const tools=await rpc.request('tools/list');assert.equal(tools.result.tools.length,5);
    const invalid=await rpc.request('tools/call',{name:'run_tests',arguments:{suite:'all;echo LAB_CANARY'}});
    assert.equal(invalid.result.isError,true);assert.match(invalid.result.content[0].text,/Input validation error/);
    const unknown=await rpc.request('no-such-method');assert.equal(unknown.error.code,-32601);
    const missing=await rpc.request('tools/call',{name:'read_file',arguments:{path:'does-not-exist.ts'}});
    assert.equal(missing.result.isError,true);assert.equal(missing.result.structuredContent.error.code,'NOT_FOUND');
    const later=await rpc.request('tools/call',{name:'read_file',arguments:{path:'src/tokenizer.ts'}});assert.equal(later.result.structuredContent.ok,true);
  } finally {await rpc.close();if(previous===undefined)delete process.env.LAB_VARIANT;else process.env.LAB_VARIANT=previous;}
  const client=await connect('workspace','reference');
  try {
    assert.equal((await client.listResources()).resources.length,1);
    assert.equal((await client.listResourceTemplates()).resourceTemplates.length,1);
    assert.equal((await client.listPrompts()).prompts.length,1);
    assert.equal((await client.getPrompt({name:'diagnose_test_failure',arguments:{}})).messages.length,1);
    const result=await call(client,'run_tests',{suite:'parser'});assert.equal(result.ok,true);
    if(!result.ok)throw new Error('Expected report');
    const id=(result.value as {runId:string}).runId;
    const resource=await client.readResource({uri:`workspace://reports/${id}`});assert.equal(resource.contents.length,1);
  } finally {await client.close();}
});
