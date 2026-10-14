#!/usr/bin/env python3
from pathlib import Path
import subprocess, shutil, json, time, sys, os
report=Path(os.environ['P01_VERIFICATION_REPORT'])
root=Path(__file__).resolve().parents[2]
results=[]
def run(name,cmd,cwd=root,expected=0,markers=()):
 start=time.monotonic()
 p=subprocess.run(cmd,cwd=cwd,capture_output=True,text=True,timeout=600)
 log=p.stdout+p.stderr
 (report/(name+'.log')).write_text(log)
 ok=p.returncode==expected and all(x in log for x in markers)
 r={'name':name,'command':cmd,'exit':p.returncode,'expected_exit':expected,'status':'pass' if ok else 'fail','duration_seconds':round(time.monotonic()-start,2),'log':name+'.log'}
 results.append(r)
 print(json.dumps(r),flush=True)
 (report/'docker.json').write_text(json.dumps(results,indent=2)+'\n')
 if not ok: print(log[-5000:],flush=True)
 return p,ok
p,ok=run('prepare-docker',['node','scripts/prepare-run.mjs','act3'])
assert ok
context=Path(p.stdout.strip()).parent
p,ok=run('docker-build',['docker','build','-f',str(root/'docker/Dockerfile'),'-t','p01-bot',str(context)])
assert ok
p,ok=run('docker-cli-smoke',['docker','run','--rm','--network','none','p01-bot','claude','--version'],markers=['2.1.283'])
assert ok
p,ok=run('docker-trust-boundary-smoke',['docker','run','--rm','--network','none','--cap-drop','ALL','--security-opt','no-new-privileges','p01-bot','sh','-c','test "$(id -u)" -ne 0 && test -z "$ANTHROPIC_API_KEY" && test -d /work/node_modules && test -x /usr/bin/timeout && echo nonroot-no-key-tooling-ready'],markers=['nonroot-no-key-tooling-ready'])
assert ok
container='p01-validation-baseline-'+str(os.getpid())
baseline=report/'image-baseline'
baseline.mkdir()
subprocess.run(['docker','create','--name',container,'--network','none','p01-bot'],check=True,capture_output=True)
try:
 subprocess.run(['docker','cp',container+':/work/.',str(baseline)],check=True,capture_output=True)
finally:
 subprocess.run(['docker','rm',container],check=True,capture_output=True)
out=root/'docker/out'
original=None
if out.exists():
 original=out.with_name('out.previous-validation-'+str(os.getpid()))
 out.rename(original)
old=(baseline/'src/parser.ts').read_text()
needle='''    // The statement ends at the table name; whatever follows is a stray token.
    this.expect("EOF");
    return { columns, table };'''
replacement='''    let where: Comparison | undefined;
    if (this.peek().type === "WHERE") {
      this.advance();
      where = this.parseExpression();
    }
    this.expect("EOF");
    return where ? { columns, table, where } : { columns, table };'''
assert needle in old
fixed=old.replace(needle,replacement)
scenarios=[('baseline-red',1,False),('valid-source-fix',0,True),('test-tamper',1,True),('package-script-tamper',1,True),('source-deleted',1,True),('source-symlink',1,True),('untrusted-git-and-deps',0,True)]
try:
 for name,exit_code,repair in scenarios:
  work=out/'work'
  out.mkdir()
  shutil.copytree(baseline,work,ignore=shutil.ignore_patterns('.git','node_modules'))
  if repair: (work/'src/parser.ts').write_text(fixed)
  if name=='test-tamper': (work/'test/parser.test.ts').write_text('throw new Error("untrusted test must not execute");\n')
  if name=='package-script-tamper':
   package=json.loads((work/'package.json').read_text()); package['scripts']['test']='touch /tmp/untrusted-package-was-run'
   (work/'package.json').write_text(json.dumps(package))
  if name=='source-deleted': (work/'src/parser.ts').unlink()
  if name=='source-symlink':
   (work/'src/parser.ts').unlink(); (work/'src/parser.ts').symlink_to('/tmp/outside-parser.ts')
  if name=='untrusted-git-and-deps':
   (work/'.git').write_text('gitdir: /never-execute-untrusted-git\n')
   (work/'node_modules').mkdir(); (work/'node_modules/.bin').mkdir()
   malicious=work/'node_modules/.bin/vitest'; malicious.write_text('#!/bin/sh\necho UNTRUSTED_DEPENDENCY_EXECUTED\nexit 0\n'); malicious.chmod(0o755)
  markers=('VERIFIED: PASS',) if exit_code==0 else ()
  p,ok=run('docker-verify-'+name,['./verify.sh'],root/'docker',exit_code,markers)
  if name=='test-tamper': assert 'changed test files' in p.stdout and 'untrusted test must not execute' not in p.stdout
  if name=='package-script-tamper': assert 'changes outside source: package.json' in p.stdout
  if name=='source-symlink': assert 'unsupported evidence entry' in p.stderr
  if name=='untrusted-git-and-deps': assert 'UNTRUSTED_DEPENDENCY_EXECUTED' not in p.stdout
  out.rename(report/('docker-evidence-'+name))
finally:
 if out.exists(): out.rename(report/('docker-evidence-interrupted-'+str(os.getpid())))
 if original: original.rename(out)
sys.exit(0 if all(r['status']=='pass' for r in results) else 1)
