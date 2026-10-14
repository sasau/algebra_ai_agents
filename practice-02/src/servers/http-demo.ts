import { createServer, type Server } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createWorkspaceServer } from './workspace.js';
import { LAB } from '../../scripts/common.js';

/** Local, stateless teaching variant. This synthetic bearer token is not production OAuth. */
export async function startHttpDemo(port = 0) {
  const token = randomBytes(24).toString('hex');
  let actualPort = port;
  const server = createServer(async (req, res) => {
    const deny = (status:number, text:string) => { res.writeHead(status, {'Content-Type':'text/plain'}); res.end(text); req.resume(); };
    const authority = new Set([`127.0.0.1:${actualPort}`, `localhost:${actualPort}`]);
    if (!authority.has(req.headers.host ?? '')) return deny(403, 'Host refused');
    if (req.headers.origin && !new Set([`http://127.0.0.1:${actualPort}`,`http://localhost:${actualPort}`]).has(req.headers.origin)) return deny(403,'Origin refused');
    const presented = req.headers.authorization ?? '';
    const expected = `Bearer ${token}`;
    if (Buffer.byteLength(presented) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(presented),Buffer.from(expected))) return deny(401,'Authentication required');
    if (req.url !== '/mcp') return deny(404,'Not found');
    if (req.method !== 'POST') return deny(405,'This stateless example supports POST requests');
    const chunks:Buffer[]=[]; let size=0;
    for await (const chunk of req) { size += chunk.length; if (size>64_000) return deny(413,'Request too large'); chunks.push(Buffer.from(chunk)); }
    let body:unknown;
    try { body=JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return deny(400,'Invalid JSON'); }
    const mcp = await createWorkspaceServer({variant:'reference'});
    const transport = new StreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
    res.once('finish',()=>{ void mcp.close(); });
    try { await mcp.connect(transport); await transport.handleRequest(req,res,body); }
    catch { if (!res.headersSent) deny(500,'Request failed'); else res.end(); await mcp.close(); }
  });
  server.listen(port,'127.0.0.1'); await once(server,'listening');
  actualPort = (server.address() as {port:number}).port;
  return { server, token, url:`http://127.0.0.1:${actualPort}/mcp`, close: () => new Promise<void>((resolve,reject)=>{server.close(error=>error?reject(error):resolve());server.closeAllConnections();}) };
}
if (process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) {
  const demo=await startHttpDemo(0);
  await mkdir(resolve(LAB,'work'),{recursive:true});
  await writeFile(resolve(LAB,'work/http-demo.json'),JSON.stringify({url:demo.url,token:demo.token}),{mode:0o600});
  console.log(`Local MCP demo at ${demo.url}. Synthetic token is in gitignored work/http-demo.json. Stop with Ctrl-C.`);
  for (const signal of ['SIGINT','SIGTERM'] as const) process.on(signal,()=>{void demo.close().then(()=>process.exit());});
}
