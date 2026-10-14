import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { Pool } from 'pg';
import { RawRpc } from './rpc.js';
import { connect, call } from './client.js';
import { requireValue, evidence, entryError, variant } from './common.js';
import { runSelectedExercise } from '../exercises/selected.js';
import { TicketStore, restrictedPoolConfig, type ReportReceipt } from '../src/core/db.js';
import { loadDbEnvironment } from '../src/core/db-env.js';
import { checkHttp } from './http-check.js';
import { runCaseE02 } from './e02.js';
import type { Result } from '../src/core/result.js';

function refused(result: Result, expected:string) {
  assert.equal(result.ok,false); if(result.ok) throw new Error('Expected refusal'); assert.equal(result.error.code,expected);
}
export async function runCase(id:string):Promise<unknown> {
  if(id==='E02') return runCaseE02();
  if(id==='E01') {
    const rpc=new RawRpc('workspace');
    try {
      await rpc.initialise();
      const missing=await rpc.request('tools/call',{name:'read_file',arguments:{path:'src/missing.ts'}});
      assert.equal(missing.result.isError,true); refused(missing.result.structuredContent,'NOT_FOUND');
      const later=await rpc.request('tools/call',{name:'read_file',arguments:{path:'src/tokenizer.ts'}});
      assert.equal(later.result.structuredContent.ok,true);
      return {exercise:id,missing:missing.result,laterCallSucceeded:true,trace:rpc.trace};
    } finally {await rpc.close();}
  }
  if(id==='E05' || id==='E06' || id==='E10') {
    const store=await TicketStore.create({variant:variant()});
    try {
      if(id==='E05') {
        const normal=requireValue(await store.getTicket({ticketId:'LAB-101'})); assert.equal(normal.ticketId,'LAB-101');
        const injection=await store.getTicket({ticketId:"LAB-101' OR '1'='1"}); refused(injection,'NOT_FOUND');
        const outside=await store.getTicket({ticketId:'OTHER-201'}); refused(outside,'NOT_FOUND');
        const grants=requireValue(await store.inspectPermissions()); assert.ok(grants.checks.length>=4); assert.ok(grants.checks.every(check=>check.denied));
        return {exercise:id,preparedInputRefusedAsData:injection,otherProject:outside,grants};
      }
      if(id==='E10') {
        const configuration=await loadDbEnvironment();
        // Ask the kernel for an unused high port, then close our own reservation.
        // No existing listener, container or database is stopped for this fixture.
        const reservation=createServer();
        await new Promise<void>((resolveCall,rejectCall)=>{
          reservation.once('error',rejectCall);
          reservation.listen(0,'127.0.0.1',resolveCall);
        });
        const address=reservation.address();
        assert.ok(address && typeof address==='object');
        const closedPort=address.port;
        assert.ok(closedPort>=1024 && closedPort<=65535 && closedPort!==configuration.port);
        await new Promise<void>((resolveCall,rejectCall)=>reservation.close(error=>error?rejectCall(error):resolveCall()));
        const unavailable=await TicketStore.create({variant:variant(),config:{...configuration,port:closedPort}});
        const start=performance.now();
        try {
          const result=await unavailable.getTicket({ticketId:'LAB-101'});
          const elapsedMs=Math.round(performance.now()-start);
          refused(result,'DATABASE_UNAVAILABLE');
          if(!result.ok) assert.equal(result.error.retryable,true);
          assert.ok(elapsedMs<3000,'Connection acquisition must stay within the two-second limit plus scheduling overhead.');
          const poolAfterFailure=unavailable.poolState();
          assert.deepEqual(poolAfterFailure,{readerTotal:0,reporterTotal:0,waiting:0});
          const healthyBackend=requireValue(await store.getTicket({ticketId:'LAB-101'}));
          assert.equal(healthyBackend.ticketId,'LAB-101');
          return {exercise:id,result,elapsedMs,closedLoopbackPort:closedPort,poolAfterFailure,
            healthyBackendTicketId:healthyBackend.ticketId,
            note:'A kernel-selected unused high loopback port was reserved and closed by this harness. Acquisition failed with no retained client; the real lab backend remained healthy. No existing service was stopped. The separate DB integration test holds a lock to verify statement-timeout rollback and retry.'};
        }
        finally {await unavailable.close();}
      }
      const input={ticketId:'LAB-101',runId:randomUUID(),summary:'Synthetic idempotency probe; not diagnostic evidence.',evidenceDigest:'0'.repeat(64),idempotencyKey:randomUUID()};
      const initialClient=await connect('tickets',variant());
      let first:ReportReceipt;
      let committedResponse:Result<ReportReceipt>;
      try {
        committedResponse=await call<ReportReceipt>(initialClient,'create_diagnostic_report',input);
        first=requireValue(committedResponse);
        assert.equal(first.replayed,false);
        // Commit has completed. The caller deliberately drops this response from
        // its workflow; the harness retains a capture solely to compare IDs.
      } finally {await initialClient.close();}
      // connect() launches a new stdio child, rather than recreating only a pool.
      const restartedClient=await connect('tickets',variant());
      try {
        const retryResponse=await call<ReportReceipt>(restartedClient,'create_diagnostic_report',input);
        const retry=requireValue(retryResponse); assert.equal(retry.reportId,first.reportId); assert.equal(retry.replayed,true);
        const conflict=await call<ReportReceipt>(restartedClient,'create_diagnostic_report',{...input,summary:'Different content'}); refused(conflict,'IDEMPOTENCY_CONFLICT');
        const config=await loadDbEnvironment(); const verifier=new Pool(restrictedPoolConfig(config,'reporter'));
        try { const count=await verifier.query<{count:number;reportId:string}>(`SELECT count(*)::integer AS count,min(report_id::text) AS "reportId"
          FROM lab_api.diagnostic_reports WHERE project_id='lab-a' AND idempotency_key=$1`,[input.idempotencyKey]);
          assert.equal(count.rows[0]!.count,1); assert.equal(count.rows[0]!.reportId,first.reportId);
          return {exercise:id,transport:'stdio',committedResponse,retryResponse,first,retry,conflict,
            independentRowCount:count.rows[0]!.count,independentStoredReportId:count.rows[0]!.reportId,
            callerPoolRestarted:true,stdioServerProcessRestarted:true,
            simulation:'The initial MCP response was captured after commit and discarded from the caller workflow. The initial stdio child was closed; a new client launched a fresh ticket-store child and retried the identical payload. This simulates caller response loss; it does not claim a real network packet was dropped.'}; }
        finally {await verifier.end();}
      } finally {await restartedClient.close();}
    } finally {await store.close();}
  }
  if(id==='E12') return {exercise:id,...await checkHttp()};
  const result=requireValue(await runSelectedExercise(id,variant()));
  const value=result as any;
  if(id==='E03') for(const row of value.fixed) refused(row.result,'PATH_DENIED');
  if(id==='E04') { assert.equal(value.fixed.status,'timeout'); assert.equal(value.fixed.descendantGone,true); assert.ok(value.fixed.retainedBytes<=20_000); }
  if(id==='E07') refused(value.fixed,'PATH_DENIED');
  if(id==='E08') assert.equal(value.changedAfterApproval,true);
  if(id==='E09') { assert.ok(value.observations[0].transportParseErrors.length>0); assert.equal(value.observations[1].transportParseErrors.length,0); }
  if(id==='E11') { assert.ok(value.fixed.returnedBytes<=20_000); assert.equal(value.fixed.truncated,true); }
  return result;
}
if(process.argv[1]?.endsWith('security.ts')) {
  try {
    const caseAt=process.argv.indexOf('--case');
    const cases=caseAt>=0?[process.argv[caseAt+1]!]:process.argv.includes('--workspace')?['E01','E02','E03','E04']:
      process.argv.includes('--all')?Array.from({length:12},(_,i)=>`E${String(i+1).padStart(2,'0')}`):['E01','E02','E03','E04','E05','E06'];
    for(const id of cases) {const result=await runCase(id);await evidence(id,result);console.log(`PASS ${id}: enforced safeguard and independently checked observation; work/evidence/${id}.json`);}
    console.log(`PASS ${cases.length} boundary checks (${variant()} variant).`);
  } catch(error) {entryError(error);}
}
