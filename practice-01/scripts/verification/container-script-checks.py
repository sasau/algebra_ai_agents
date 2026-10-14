#!/usr/bin/env python3
from pathlib import Path
import subprocess, shutil, json, os, sys, time, hashlib
report=Path(os.environ['P01_VERIFICATION_REPORT'])
root=Path(__file__).resolve().parents[2]
fixture=report/'container-script-fixtures'
if fixture.exists(): fixture.rename(report/('container-script-fixtures-previous-'+str(os.getpid())))
fixture.mkdir()
fixture_docker=fixture/'docker'; fixture_docker.mkdir()
(fixture/'scripts').mkdir()
shutil.copy2(root/'scripts/prepare-run.mjs',fixture/'scripts/prepare-run.mjs')
shutil.copytree(root/'parser-ts',fixture/'parser-ts',ignore=shutil.ignore_patterns('node_modules','.git','build','.env','*.local.*'))
for name in ['run.sh','break-it.sh','Dockerfile']:
 shutil.copy2(root/'docker'/name,fixture_docker/name)
node_fixture=report/'container-cli-fixture.mjs'
node_fixture.write_text('''#!/usr/bin/env node
// Test double. No model, credentials or network client is constructed.
import fs from "node:fs";
const args=process.argv.slice(2);
const at=flag=>args[args.indexOf(flag)+1];
if (!args.includes("--dangerously-skip-permissions") || at("--output-format")!=="json" || process.getuid()===0) process.exit(8);
const goal=args.at(-1);
if (goal!==process.env.GOAL || at("--max-turns")!==process.env.MAX_TURNS || at("--max-budget-usd")!==process.env.MAX_BUDGET) process.exit(9);
if (goal.includes("forever")) {
 console.log(JSON.stringify({type:"result",subtype:"error_max_turns",terminal_reason:"max_turns",is_error:true,num_turns:Number(process.env.MAX_TURNS),total_cost_usd:0.03,result:"Synthetic turn-limit fixture; no model was called."}));
 process.exit(1);
}
const path="/work/src/parser.ts";
const source=fs.readFileSync(path,"utf8");
const old='    // The statement ends at the table name; whatever follows is a stray token.\\n    this.expect("EOF");\\n    return { columns, table };';
const replacement='    let where: Comparison | undefined;\\n    if (this.peek().type === "WHERE") {\\n      this.advance();\\n      where = this.parseExpression();\\n    }\\n    this.expect("EOF");\\n    return where ? { columns, table, where } : { columns, table };';
if (!source.includes(old)) process.exit(10);
fs.writeFileSync(path,source.replace(old,replacement));
console.log(JSON.stringify({type:"result",subtype:"success",terminal_reason:"end_turn",is_error:false,num_turns:5,total_cost_usd:0.01,result:"Synthetic repair fixture; no model was called.",fixture_goal:goal}));
'''); node_fixture.chmod(0o755)
image='p01-cli-fixture-'+str(os.getpid())
image_context=report/'cli-image-context'; image_context.mkdir(exist_ok=True)
shutil.copy2(node_fixture,image_context/node_fixture.name)
dockerfile=image_context/'Dockerfile.cli-fixture'
dockerfile.write_text('FROM p01-bot\nUSER root\nRUN rm -f /usr/local/bin/claude\nCOPY container-cli-fixture.mjs /usr/local/bin/fixture-claude.mjs\nRUN chmod 755 /usr/local/bin/fixture-claude.mjs && ln -s fixture-claude.mjs /usr/local/bin/claude\nUSER node\n')
actual=shutil.which('docker')
results=[]
def run(name,cmd,cwd,env=None,expected=0,markers=()):
 start=time.monotonic(); p=subprocess.run(cmd,cwd=cwd,env=env,capture_output=True,text=True,timeout=300)
 log=p.stdout+p.stderr; (report/(name+'.log')).write_text(log)
 ok=p.returncode==expected and all(x in log for x in markers)
 r={'name':name,'command':cmd,'exit':p.returncode,'expected_exit':expected,'status':'pass' if ok else 'fail','duration_seconds':round(time.monotonic()-start,2),'log':name+'.log','mode':'offline CLI fixture; real Docker; no network'}
 results.append(r); print(json.dumps(r),flush=True); (report/'container-scripts.json').write_text(json.dumps(results,indent=2)+'\n')
 if not ok: print(log[-5000:],flush=True)
 return p,ok
p,ok=run('docker-build-cli-fixture',[actual,'build','-f',str(dockerfile),'-t',image,str(image_context)],report); assert ok
shim_dir=report/'docker-cli-shim'; shim_dir.mkdir(exist_ok=True)
shim=shim_dir/'docker'
shim.write_text('''#!/usr/bin/env python3
import os,sys,pathlib,json
args=sys.argv[1:]
if args[0]=='build':
 context=pathlib.Path(args[-1]); assert (context/'parser-ts/package-lock.json').exists()
 assert not (context/'parser-ts/node_modules').exists()
 assert not any(context.rglob('.env'))
 print('OFFLINE_FIXTURE: existing test image replaces the already-verified build.')
 sys.exit(0)
args=[os.environ['FIXTURE_IMAGE'] if x=='p01-bot' else x for x in args]
if args[0]=='run':
 assert '--mount' not in args and '-v' not in args
 assert args[args.index('--cpus')+1]=='1'
 assert args[args.index('--memory')+1]=='768m'
 assert args[args.index('--pids-limit')+1]=='128'
 assert args[args.index('--cap-drop')+1]=='ALL'
 assert args[args.index('--security-opt')+1]=='no-new-privileges'
 args=args[:1]+['--network','none']+args[1:]
os.execv(os.environ['FIXTURE_DOCKER'],[os.environ['FIXTURE_DOCKER']]+args)
'''); shim.chmod(0o755)
env=os.environ.copy(); env['PATH']=str(shim_dir)+os.pathsep+env['PATH']; env['FIXTURE_IMAGE']=image; env['FIXTURE_DOCKER']=actual; env['ANTHROPIC_API_KEY']='sk-ant-offline-fixture-not-a-key'
try:
 p,ok=run('container-run-success',['./run.sh'],fixture_docker,env,markers=['Synthetic repair fixture','Now run ./verify.sh']); assert ok
 out=fixture_docker/'out'; assert (out/'exit-code').read_text().strip()=='0'; assert json.loads((out/'result.json').read_text())['is_error'] is False
 (out/'archive-marker').write_text('preserve previous evidence\n')
 env['GOAL']='Make npm test pass. $(touch /work/injected) `touch /work/injected2` "quoted"'
 p,ok=run('container-run-quoted-goal-and-archive',['./run.sh'],fixture_docker,env,markers=['Synthetic repair fixture']); assert ok
 saved=json.loads((out/'result.json').read_text()); assert saved['fixture_goal']==env['GOAL']; assert not (out/'work/injected').exists() and not (out/'work/injected2').exists()
 archive=list(fixture_docker.glob('out.previous-*')); assert len(archive)==1 and (archive[0]/'archive-marker').exists()
 success_hash=hashlib.sha256((out/'result.json').read_bytes()).hexdigest()
 env.pop('GOAL')
 p,ok=run('container-break-it-budget',['./break-it.sh'],fixture_docker,env,markers=['the TURN budget halted it','No finite run completes a forever goal']); assert ok
 other=fixture_docker/'out-break-it'; assert (other/'exit-code').read_text().strip()=='1'; assert json.loads((other/'result.json').read_text())['num_turns']==6
 assert hashlib.sha256((out/'result.json').read_bytes()).hexdigest()==success_hash
 for name,variable,value,marker in [('invalid-turns','MAX_TURNS','0','MAX_TURNS must be'),('invalid-budget','MAX_BUDGET','0','MAX_BUDGET must be'),('invalid-output','OUT_NAME','other','OUT_NAME must be')]:
  bad=env.copy(); bad[variable]=value
  p,ok=run('container-'+name,['./run.sh'],fixture_docker,bad,1,[marker]); assert ok
finally:
 subprocess.run([actual,'image','rm',image],capture_output=True,text=True)
sys.exit(0 if all(r['status']=='pass' for r in results) else 1)
