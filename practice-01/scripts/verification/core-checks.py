#!/usr/bin/env python3
from pathlib import Path
import subprocess, time, json, re, sys, os, shutil
report=Path(os.environ['P01_VERIFICATION_REPORT'])
suite=sys.argv[1]
root=Path(__file__).resolve().parents[2]
suites={
 'parser-install': [('parser-ci','parser-ts',['npm','ci','--no-audit','--no-fund'],0,[]),('parser-typecheck','parser-ts',['npm','run','typecheck'],0,[]),('parser-baseline','parser-ts',['npm','test'],1,[r'4 passed',r'1 failed',r'unexpected token WHERE at 1:17'])],
 'ts-install': [('ts-ci','ts',['npm','ci','--no-audit','--no-fund'],0,[]),('ts-typecheck','ts',['npm','run','typecheck'],0,[]),('ts-tool-tests','ts',['npm','test'],0,[r'# pass 4',r'# fail 0'])],
 'java-tests': [('java-tool-tests','java',['./gradlew','test','--rerun-tasks','--console=plain'],0,[r'BUILD SUCCESSFUL'])],
 'demos': [('ts-check','ts',['npm','run','check'],0,[r'ALL CHECKS PASSED',r'no API call made']),('ts-tools-demo','ts',['npm','run','tools:demo'],0,[r'DEMO PASSED',r'unexpected token WHERE']),('java-check','java',['./gradlew','checkSetup','--console=plain'],0,[r'ALL CHECKS PASSED',r'no API call made']),('java-tools-demo','java',['./gradlew','toolsDemo','--console=plain'],0,[r'DEMO PASSED',r'unexpected token WHERE'])],
 'evidence': [('evidence-tests','docker',['node','--test','check-evidence.test.mjs'],0,[r'# pass 7',r'# fail 0']),('shell-syntax','.', ['bash','-n','docker/run.sh','docker/verify.sh','docker/break-it.sh','parser-java/workflow.sh'],0,[])],
 'missing-key': [('ts-live-missing-key','ts',['npm','run','check:live'],1,[r'ANTHROPIC_API_KEY is not set',r'no API call made']),('ts-agent-missing-key','ts',['npm','run','agent'],1,[r'ANTHROPIC_API_KEY is not set']),('java-live-missing-key','java',['./gradlew','checkSetup','-Plive','--console=plain'],1,[r'ANTHROPIC_API_KEY is not set',r'no API call made']),('java-agent-missing-key','java',['./gradlew','agent','--console=plain'],1,[r'ANTHROPIC_API_KEY is not set']),('docker-missing-key','docker',['./run.sh'],1,[r'ANTHROPIC_API_KEY is not set'])],
}
results=[]
for name, cwd, cmd, expected, patterns in suites[suite]:
 start=time.monotonic()
 run_cwd=root/cwd
 run_env=os.environ.copy()
 if suite=='missing-key':
  run_env['ANTHROPIC_API_KEY']=''
  if name=='docker-missing-key':
   run_cwd=report/'missing-key-fixture/docker'
   run_cwd.mkdir(parents=True)
   shutil.copy2(root/'docker/run.sh',run_cwd/'run.sh')
 try:
  proc=subprocess.run(cmd,cwd=run_cwd,env=run_env,capture_output=True,text=True,timeout=420)
  log=proc.stdout+proc.stderr
  code=proc.returncode
 except subprocess.TimeoutExpired as e:
  log=str(e); code=124
 (report/(name+'.log')).write_text(log)
 assertions={p: bool(re.search(p,log)) for p in patterns}
 passed=code==expected and all(assertions.values())
 record={'name':name,'command':cmd,'cwd':str(run_cwd),'exit':code,'expected_exit':expected,'status':'pass' if passed else 'fail','assertions':assertions,'duration_seconds':round(time.monotonic()-start,2),'log':name+'.log'}
 results.append(record)
 print(json.dumps(record),flush=True)
 (report/(suite+'.json')).write_text(json.dumps(results,indent=2)+'\n')
 if not passed:
  print(log[-5500:],flush=True)
  if name.endswith('-ci'): break
sys.exit(0 if all(x['status']=='pass' for x in results) else 1)
