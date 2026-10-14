#!/usr/bin/env python3
"""Verify Practice 01 with no provider credentials or model calls."""
from pathlib import Path
import argparse, datetime, hashlib, json, os, subprocess, sys, tempfile, time

parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--docker',action='store_true',help='also build the image and run container/verifier fixtures')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
runs=root/'.runs'; runs.mkdir(exist_ok=True)
report=Path(tempfile.mkdtemp(prefix='verification-',dir=runs))
env=os.environ.copy(); env['P01_VERIFICATION_REPORT']=str(report)
protected={str(f.relative_to(root)):hashlib.sha256(f.read_bytes()).hexdigest()
 for base in [root/'parser-java/src',root/'parser-ts/src',root/'parser-ts/test']
 for f in base.rglob('*') if f.is_file()}
modules=root/'scripts/verification'
jobs=[('parser-install','core-checks.py',['parser-install']),('ts-install','core-checks.py',['ts-install']),
      ('java-tests','core-checks.py',['java-tests']),('demos','core-checks.py',['demos']),
      ('evidence','core-checks.py',['evidence']),('missing-key','core-checks.py',['missing-key']),
      ('act1','act1-checks.py',[]),('agent-loops','agent-loops.py',[])]
if args.docker: jobs += [('docker','docker-checks.py',[]),('container-scripts','container-script-checks.py',[])]
module_results=[]
print('Offline verification: controlled fixtures replace all model responses.',flush=True)
print('Reports: '+str(report),flush=True)
for name,script,argv in jobs:
 start=time.monotonic()
 try:
  p=subprocess.run([sys.executable,str(modules/script),*argv],env=env,capture_output=True,text=True,timeout=900)
  log=p.stdout+p.stderr; code=p.returncode
 except subprocess.TimeoutExpired as error:
  log=str(error); code=124
 (report/(name+'-suite.log')).write_text(log)
 module_results.append({'suite':name,'exit':code,'status':'pass' if code==0 else 'fail','seconds':round(time.monotonic()-start,2)})
 print(('PASS ' if code==0 else 'FAIL ')+name,flush=True)
 if code: print(log[-6000:],flush=True)
unchanged=all((root/f).is_file() and hashlib.sha256((root/f).read_bytes()).hexdigest()==hash for f,hash in protected.items())
checks=[]
for file in sorted(report.glob('*.json')):
 if file.name=='java-parser-baseline-counts.json': continue
 value=json.loads(file.read_text())
 if isinstance(value,list): checks+=value
result={'date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Practice 01 installed repository; offline verification',
 'model_calls':0,'modules':module_results,'checks':checks,'protected_parser_files_unchanged':unchanged,
 'live_skipped':['provider credentials/network/model availability','interactive Claude Code skill and agent behavior','unattended real-model repair and stopping behavior'],
 'fixture_limits':'Scripted responses verify harness behavior. They do not measure model ability or real CLI spending/turn enforcement.'}
(report/'results.json').write_text(json.dumps(result,indent=2)+'\n')
passed=all(x['status']=='pass' for x in module_results) and unchanged and all(x['status']=='pass' for x in checks)
print(('PASS' if passed else 'FAIL')+': '+str(sum(x['status']=='pass' for x in checks))+'/'+str(len(checks))+' checks; parser sources/tests preserved; no provider calls.',flush=True)
print('Detailed results: '+str(report/'results.json'),flush=True)
sys.exit(0 if passed else 1)
