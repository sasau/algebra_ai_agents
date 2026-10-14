import { Host, readTool, type ReactContext } from '../src/host.js';
import { explorerRole, validateBrief, validateChildReport } from '../src/delegation-contract.js';
import type { ChildReport, Message } from '../src/types.js';
export type DelegateContext={parent:Host; run:(context:ReactContext)=>Promise<unknown>};
export function makeDelegate(ctx:DelegateContext):(args:unknown)=>Promise<ChildReport>{
  let active=false;
  return async (args:unknown):Promise<ChildReport>=>{
    // BEGIN TODO_ACT_3
    throw new Error("TODO_ACT_3: implement this architecture checkpoint");
    // END TODO_ACT_3
  };
}
