import { assistantMessage, toolMessage, singleToolError, validateTurns, type ReactContext } from '../src/host.js';
import type { AgentResult } from '../src/types.js';
export async function runReact({host,messages,maxTurns}:ReactContext):Promise<AgentResult>{
  validateTurns(maxTurns);
  // BEGIN TODO_ACT_1
  for(let turn=1;turn<=maxTurns;turn++){
    const reply=await host.model(messages);
    messages.push(assistantMessage(reply)); // preserve visible content AND every requested id
    if(reply.toolCalls.length===0)return {status:'complete',messages,turns:turn};
    if(reply.toolCalls.length>1){
      for(const call of reply.toolCalls)messages.push(toolMessage(call.id,singleToolError));
      continue; // reject the entire turn; never execute or silently drop one request
    }
    const call=reply.toolCalls[0];
    const observation=await host.dispatch(call);
    messages.push(toolMessage(call.id,observation));
  }
  return {status:'limit',messages,turns:maxTurns};
  // END TODO_ACT_1
}
