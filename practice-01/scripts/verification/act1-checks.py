#!/usr/bin/env python3
from pathlib import Path
import subprocess, os, json, time, hashlib, shutil, sys, xml.etree.ElementTree as ET
report=Path(os.environ['P01_VERIFICATION_REPORT'])
root=Path(__file__).resolve().parents[2]
results=[]
def record(name,cmd,cwd,expected,markers=(),env=None):
 start=time.monotonic(); p=subprocess.run(cmd,cwd=cwd,env=env,capture_output=True,text=True,timeout=300)
 log=p.stdout+p.stderr; (report/(name+'.log')).write_text(log)
 ok=p.returncode==expected and all(x in log for x in markers)
 r={'name':name,'command':cmd,'cwd':str(cwd),'exit':p.returncode,'expected_exit':expected,'status':'pass' if ok else 'fail','duration_seconds':round(time.monotonic()-start,2),'log':name+'.log'}
 results.append(r); print(json.dumps(r),flush=True)
 (report/'act1.json').write_text(json.dumps(results,indent=2)+'\n')
 if not ok: print(log[-4500:],flush=True)
 return p,ok
p,ok=record('prepare-act1',['node','scripts/prepare-run.mjs','act1'],root,0); assert ok
red=Path(p.stdout.strip())
assert (red/'.claude/skills/fix-test/SKILL.md').read_bytes()==(root/'parser-java/.claude/skills/fix-test/SKILL.md').read_bytes()
p,ok=record('java-parser-focused-baseline',['./gradlew','test','--tests','ParserTest','--rerun-tasks','--console=plain'],red,1,['unexpected token WHERE at 1:17','2 tests completed, 1 failed']); assert ok
p,ok=record('java-parser-full-baseline',['./gradlew','test','--rerun-tasks','--console=plain'],red,1,['unexpected token WHERE at 1:17']); assert ok
xml=list((red/'build/test-results/test').glob('TEST-*.xml'))
counts={'tests':0,'failures':0,'errors':0}
for f in xml:
 attrs=ET.parse(f).getroot().attrib
 for k in counts: counts[k]+=int(attrs.get(k,0))
(report/'java-parser-baseline-counts.json').write_text(json.dumps(counts,indent=2)+'\n')
assert counts['failures']==1 and counts['errors']==0
p,ok=record('prepare-act1-repair',['node','scripts/prepare-run.mjs','act1'],root,0); assert ok
fixed=Path(p.stdout.strip()); assert fixed!=red
src=fixed/'src/main/java/lusql/parser/Parser.java'
old='''        // After FROM <table> the statement ends.
        expect(EOF);
        return new Select(columns, table, Optional.empty());'''
new='''        Optional<Expr> where = Optional.empty();
        if (peek().type() == TokenType.WHERE) {
            advance();
            where = Optional.of(parseExpression());
        }
        expect(EOF);
        return new Select(columns, table, where);'''
s=src.read_text(); assert old in s; src.write_text(s.replace(old,new))
p,ok=record('java-parser-source-only-repair',['./gradlew','test','--rerun-tasks','--console=plain'],fixed,0,['BUILD SUCCESSFUL']); assert ok
for f in (root/'parser-java/src/test').rglob('*.java'):
 rel=f.relative_to(root/'parser-java'); assert f.read_bytes()==(fixed/rel).read_bytes()==(red/rel).read_bytes()
stub=report/'workflow-cli-fixture'; stub.mkdir()
cli=stub/'claude'
cli.write_text('''#!/usr/bin/env python3
import os,sys,pathlib
args=sys.argv[1:]
def value(flag): return args[args.index(flag)+1]
assert '--bare' in args
assert value('--tools')==''
assert '--strict-mcp-config' in args
assert value('--mcp-config')=='{"mcpServers":{}}'
assert value('--max-turns')=='1'
assert value('--max-budget-usd')=='0.05'
assert value('--output-format')=='text'
text=sys.stdin.read()
assert 'ParserTest > parsesWhereClause() FAILED' in text
pathlib.Path(os.environ['FIXTURE_CLI_MARKER']).write_text('text-only request observed; tool isolation flags checked\\n')
if os.environ['FIXTURE_CLI_MODE']=='failure':
 print('offline simulated CLI failure',file=sys.stderr); sys.exit(1)
print('ParserTest fails at the WHERE token.\\nThe parser expects EOF immediately after the table name.')
'''); cli.chmod(0o755)
env=os.environ.copy(); env['PATH']=str(stub)+os.pathsep+env['PATH']; env['ANTHROPIC_API_KEY']='sk-ant-offline-fixture-not-a-key'; env['FIXTURE_CLI_MODE']='success'
marker=report/'workflow-cli-called.txt'; env['FIXTURE_CLI_MARKER']=str(marker)
p,ok=record('workflow-red-summary-success',['./workflow.sh'],red,1,['workflow: ParserTest is RED','workflow reports; it does not fix'],env); assert ok and marker.exists()
shutil.copy2(red/'.workflow-out.txt',report/'workflow-red-summary-success-gradle.log')
marker.unlink(); env['FIXTURE_CLI_MODE']='failure'
p,ok=record('workflow-red-summary-failure',['./workflow.sh'],red,2,['model summary step failed'],env); assert ok and marker.exists()
shutil.copy2(red/'.workflow-out.txt',report/'workflow-red-summary-failure-gradle.log')
marker.unlink(); env.pop('ANTHROPIC_API_KEY')
p,ok=record('workflow-missing-key',['./workflow.sh'],red,2,['ANTHROPIC_API_KEY must be exported'],env); assert ok and not marker.exists()
shutil.copy2(red/'.workflow-out.txt',report/'workflow-missing-key-gradle.log')
p,ok=record('workflow-green',['./workflow.sh'],fixed,0,['ParserTest is GREEN'],env); assert ok and not marker.exists()
shutil.copy2(fixed/'.workflow-out.txt',report/'workflow-green-gradle.log')
failed=report/'workflow-build-fixture'; failed.mkdir(); shutil.copy2(root/'parser-java/workflow.sh',failed/'workflow.sh')
gradle=failed/'gradlew'; gradle.write_text('#!/bin/sh\necho "BUILD FAILED: offline simulated build failure"\nexit 1\n'); gradle.chmod(0o755)
p,ok=record('workflow-build-failure',['./workflow.sh'],failed,2,['setup/build error, not an observed test failure'],env); assert ok and not marker.exists()
assert (root/'parser-java/src/main/java/lusql/parser/Parser.java').read_bytes()==(red/'src/main/java/lusql/parser/Parser.java').read_bytes()
sys.exit(0 if all(r['status']=='pass' for r in results) else 1)
