import { Host, type ReactContext, system, task } from '../src/host.js';
import type { AttemptResult, Lesson, Message } from '../src/types.js';
import type { Workspace } from '../src/workspace.js';
export type ReflectionContext={workspace:Workspace; makeHost:(attempt:number)=>Host; run:(context:ReactContext)=>Promise<unknown>; maxAttempts:number; impossible?:boolean};
export async function runReflexion(ctx:ReflectionContext):Promise<AttemptResult>{
  // BEGIN TODO_ACT_2
    throw new Error("TODO_ACT_2: implement this architecture checkpoint");
    // END TODO_ACT_2
}
