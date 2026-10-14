import { Host, readTool, type ReactContext } from '../src/host.js';
import { explorerRole, validateBrief, validateChildReport } from '../src/delegation-contract.js';
import type { ChildReport, Message } from '../src/types.js';
export type DelegateContext={parent:Host; run:(context:ReactContext)=>Promise<unknown>};
export function makeDelegate(ctx:DelegateContext):(args:unknown)=>Promise<ChildReport>{
  let active=false;
  return async (args:unknown):Promise<ChildReport>=>{
    // BEGIN TODO_ACT_3
    if(ctx.parent.depth!==0)throw new Error('DELEGATION_DEPTH_LIMIT: maximum depth is 1');
    if(active)throw new Error('DELEGATION_MUST_BE_SEQUENTIAL');
    const brief=validateBrief(args); // supplied shape checks
    active=true;
    try{
      const child=new Host(ctx.parent.workspace,ctx.parent.client,ctx.parent.budget,[readTool],'child',1);
      const messages:Message[]=[
        {role:'system',content:explorerRole},
        {role:'user',content:'Complete bounded brief: '+JSON.stringify(brief)}
      ]; // fresh history: role + brief, no parent transcript
      await ctx.run({host:child,messages,maxTurns:brief.maxTurns});
      return validateChildReport(messages); // supplied return-contract checks
    }finally{active=false;}
    // END TODO_ACT_3
  };
}
