import test from 'node:test';
import assert from 'node:assert/strict';
import { checkHttp } from '../scripts/http-check.js';
test('local Streamable HTTP enforces origin and independent authentication',async()=>{
  const result=await checkHttp();assert.equal(result.missingAuth,401);assert.equal(result.untrustedOrigin,403);assert.equal(result.authenticatedInitialise,200);
});
