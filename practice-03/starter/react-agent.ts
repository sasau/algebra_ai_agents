import { assistantMessage, toolMessage, singleToolError, validateTurns, type ReactContext } from '../src/host.js';
import type { AgentResult } from '../src/types.js';
export async function runReact({host,messages,maxTurns}:ReactContext):Promise<AgentResult>{
  validateTurns(maxTurns);
  // BEGIN TODO_ACT_1
    throw new Error("TODO_ACT_1: implement this architecture checkpoint");
    // END TODO_ACT_1
}
