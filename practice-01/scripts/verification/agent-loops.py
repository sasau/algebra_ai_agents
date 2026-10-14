#!/usr/bin/env python3
from pathlib import Path
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
import subprocess, threading, json, time, os, sys
report=Path(os.environ['P01_VERIFICATION_REPORT'])
root=Path(__file__).resolve().parents[2]
results=[]
fixture_source=str(Path(__file__).with_name('java')).replace(chr(92),chr(92)*2).replace(chr(39),chr(92)+chr(39))
(report/'fixture.init.gradle').write_text("gradle.projectsEvaluated {\n    def p = gradle.rootProject\n    p.sourceSets.test.java.srcDir('__FIXTURE_SOURCE__')\n    p.tasks.register('offlineAgentFixture', JavaExec) {\n        dependsOn p.tasks.named('testClasses')\n        classpath = p.sourceSets.test.runtimeClasspath\n        mainClass = 'lab.OfflineAgentFixture'\n        args(p.findProperty('fixture') ?: 'success')\n        if (p.hasProperty('fixtureSteps')) args(p.property('fixtureSteps'))\n    }\n}\n".replace('__FIXTURE_SOURCE__',fixture_source))
source=(root/'parser-ts/src/parser.ts').read_text()
old='''    // The statement ends at the table name; whatever follows is a stray token.
    this.expect("EOF");
    return { columns, table };'''
new='''    let where: Comparison | undefined;
    if (this.peek().type === "WHERE") {
      this.advance();
      where = this.parseExpression();
    }
    this.expect("EOF");
    return where ? { columns, table, where } : { columns, table };'''
assert old in source
fixed=source.replace(old,new)
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args): pass
 def do_POST(self):
  srv=self.server
  body=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
  srv.calls+=1
  n=srv.calls
  def require(ok,message):
   if not ok: raise AssertionError(message)
  try:
   require(self.path.split('?')[0]=='/v1/messages','messages endpoint')
   require(self.headers.get('x-api-key')=='sk-ant-offline-fixture-not-a-key','synthetic credential only')
   require(body['model']=='claude-haiku-4-5','pinned model')
   if srv.scenario=='setup':
    require(body['max_tokens']==5 and n==1,'small setup request')
    blocks=[{'type':'text','text':'OK'}]; stop='end_turn'
   else:
    require(len(body['messages'])==1+2*(n-1),'history growth')
    require({t['name'] for t in body['tools']}=={'read_file','write_file','run_tests'},'tool schemas')
    if n>1:
     require(body['messages'][-2]['content']==srv.last_blocks,'assistant response kept intact')
     actual=body['messages'][-1]['content']
     require(len(actual)==len(srv.expected),'result count')
     for result,(id,error,marker) in zip(actual,srv.expected):
      require(result['type']=='tool_result' and result['tool_use_id']==id,'paired tool IDs')
      require(bool(result.get('is_error'))==error,'error flag propagated')
      require(marker in result['content'],'actual tool output')
    srv.expected=[]
    def tool(name,input,error=False,marker=''):
     id=f'fixture_{n}_{len(srv.expected)}'; srv.expected.append((id,error,marker))
     return {'type':'tool_use','id':id,'name':name,'input':input}
    stop='tool_use'
    if srv.scenario=='api-error':
     self.send_response(503); self.send_header('Content-Type','application/json'); self.end_headers()
     self.wfile.write(json.dumps({'type':'error','error':{'type':'overloaded_error','message':'offline fixture API unavailable'}}).encode()); return
    elif srv.scenario=='max-tokens': blocks=[]; stop='max_tokens'
    elif srv.scenario=='false-success': blocks=[{'type':'text','text':'I claim tests pass.'}]; stop='end_turn'
    elif srv.scenario=='budget': blocks=[tool('read_file',{'path':'src/parser.ts'},False,'parseSelect')]
    elif n==1:
     blocks=[tool('read_file',{'path':'src/parser.ts'},False,'parseSelect'),tool('read_file',{'path':'test/parser.test.ts'},False,'WHERE')]
    elif n==2:
     blocks=[tool('write_file',{'path':'test/parser.test.ts','content':'tamper'},True,'src'),tool('write_file',{'path':'package.json','content':'tamper'},True,'src'),tool('unknown_tool',{},True,'unknown tool')]
    elif n==3: blocks=[tool('write_file',{'path':'src/parser.ts','content':fixed},False,'written')]
    elif n==4: blocks=[tool('run_tests',{},False,'exit code: 0')]
    elif n==5: blocks=[{'type':'text','text':'All supplied tests pass.'}]; stop='end_turn'
    else: raise AssertionError('fixture exhausted')
   srv.last_blocks=blocks
   response={'id':f'msg_fixture_{n}','type':'message','role':'assistant','model':'claude-haiku-4-5','content':blocks,'stop_reason':stop,'stop_sequence':None,'usage':{'input_tokens':100,'output_tokens':20}}
   self.send_response(200); self.send_header('Content-Type','application/json'); self.end_headers(); self.wfile.write(json.dumps(response).encode())
  except Exception as e:
   srv.errors.append(str(e)); self.send_response(500); self.end_headers(); self.wfile.write(str(e).encode())
scenarios=[('setup',0,1,None,['API round-trip']),('success',0,5,None,['source changes','5','model ended']),('false-success',1,1,None,['independent verification found the test still red']),('budget',1,3,3,['budget exhausted after 3 steps']),('max-tokens',1,1,None,['max_tokens']),('api-error',1,1,None,['offline fixture API unavailable'])]
tracks=sys.argv[1:] or ['ts','java']
for track in tracks:
 for scenario,exit_code,calls,steps,markers in scenarios:
  env=os.environ.copy()
  for name in ['ANTHROPIC_API_KEY','ANTHROPIC_AUTH_TOKEN','ANTHROPIC_BASE_URL']: env.pop(name,None)
  env['DISABLE_TELEMETRY']='1'
  env['ANTHROPIC_AUTH_TOKEN']='offline-auth-token-not-real'
  server=None
  if track=='ts':
   server=ThreadingHTTPServer(('127.0.0.1',0),Handler); server.calls=0; server.errors=[]; server.scenario=scenario; server.expected=[]; server.last_blocks=[]
   threading.Thread(target=server.serve_forever,daemon=True).start()
   env['ANTHROPIC_API_KEY']='sk-ant-offline-fixture-not-a-key'
   env['ANTHROPIC_BASE_URL']=f'http://127.0.0.1:{server.server_port}'
   cmd=['npm','run','check:live' if scenario=='setup' else 'agent']
   if steps: cmd+=['--','--max-steps',str(steps)]
  else:
   cmd=['./gradlew','offlineAgentFixture','--init-script',str(report/'fixture.init.gradle'),'-Pfixture='+scenario,'--console=plain']
   if steps: cmd+=['-PfixtureSteps='+str(steps)]
  name='mock-'+track+'-'+scenario
  start=time.monotonic()
  p=subprocess.run(cmd,cwd=root/track,env=env,capture_output=True,text=True,timeout=240)
  log=p.stdout+p.stderr
  (report/(name+'.log')).write_text(log)
  if server:
   server.shutdown(); actual_calls=server.calls; errors=server.errors
  else:
   import re
   found=re.findall(r'FIXTURE_CALLS=(\d+)',log); actual_calls=int(found[-1]) if found else 0; errors=[]
  ok=p.returncode==exit_code and actual_calls==calls and not errors and all(x in log for x in markers)
  r={'name':name,'command':cmd,'exit':p.returncode,'expected_exit':exit_code,'mock_calls':actual_calls,'expected_calls':calls,'fixture_errors':errors,'status':'pass' if ok else 'fail','duration_seconds':round(time.monotonic()-start,2),'log':name+'.log'}
  results.append(r)
  print(json.dumps(r),flush=True)
  (report/('mock-'+track+'.json')).write_text(json.dumps([x for x in results if x['name'].startswith('mock-'+track+'-')],indent=2)+'\n')
  if not ok: print(log[-6500:],flush=True)
sys.exit(0 if all(r['status']=='pass' for r in results) else 1)
