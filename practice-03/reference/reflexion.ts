import { Host, type ReactContext, system, task } from '../src/host.js';
import type { AttemptResult, Lesson, Message } from '../src/types.js';
import type { Workspace } from '../src/workspace.js';
export type ReflectionContext={workspace:Workspace; makeHost:(attempt:number)=>Host; run:(context:ReactContext)=>Promise<unknown>; maxAttempts:number; impossible?:boolean};
export async function runReflexion(ctx:ReflectionContext):Promise<AttemptResult>{
  // BEGIN TODO_ACT_2
  if(!Number.isInteger(ctx.maxAttempts)||ctx.maxAttempts<1||ctx.maxAttempts>3)throw new Error('INVALID_ATTEMPT_LIMIT');
  const lessons:Lesson[]=[];
  let evaluation=await ctx.workspace.evaluate(ctx.impossible);
  for(let attempt=1;attempt<=ctx.maxAttempts;attempt++){
    const host=ctx.makeHost(attempt);
    // Source edits and concise lessons survive. Tool history starts fresh.
    const messages:Message[]=[{role:'system',content:system},{role:'user',content:task+'\nPrior written lessons: '+JSON.stringify(lessons)}];
    await ctx.run({host,messages,maxTurns:7});
    evaluation=await ctx.workspace.evaluate(ctx.impossible); // independent, never trust completion text
    if(evaluation.passed)return {passed:true,attempts:attempt,lessons,evaluation};
    if(attempt<ctx.maxAttempts){
      const feedback=evaluation.output.slice(-6000);
      const reply=await host.model([{role:'system',content:'ROLE: reflection. Write one concise actionable lesson from independent test feedback. Do not call tools. Visible summary only.'},{role:'user',content:feedback}],[],'reflection');
      if(reply.toolCalls.length)throw new Error('REFLECTION_CANNOT_CALL_TOOLS');
      if(!reply.content.trim())throw new Error('EMPTY_REFLECTION');
      lessons.push({attempt,feedback,lesson:reply.content.slice(0,1000)});
    }
  }
  return {passed:false,attempts:ctx.maxAttempts,lessons,evaluation};
  // END TODO_ACT_2
}
