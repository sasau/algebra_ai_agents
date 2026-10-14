import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { once } from 'node:events';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';
import { resolve } from 'node:path';
import { LAB, variant } from './common.js';

/** Sends raw JSON-RPC; there is deliberately no client argument-schema validation. */
export class RawRpc {
  private child: ChildProcessWithoutNullStreams;
  private id = 0;
  readonly trace: unknown[] = [];
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void; timer: NodeJS.Timeout }>();
  constructor(server: 'workspace' | 'tickets') {
    this.child = spawn(process.execPath, [resolve(LAB, 'scripts/launch-server.mjs'), server], {
      cwd: LAB, detached: process.platform !== 'win32', stdio: 'pipe',
      env: { PATH: process.env.PATH ?? '', LAB_VARIANT: variant(), LAB_DB_PORT: process.env.LAB_DB_PORT ?? '55432' },
    });
    // Drain diagnostics; none of the raw environment or sensitive error objects is recorded.
    this.child.stderr.resume();
    const lines = createInterface({ input: this.child.stdout });
    lines.on('line', line => {
      if (Buffer.byteLength(line) > 256_000) return this.failAll('Oversize protocol message.');
      try {
        const message = JSON.parse(line);
        this.trace.push({ direction: 'server', message });
        if (typeof message.id === 'number') {
          const pending = this.pending.get(message.id);
          if (pending) { clearTimeout(pending.timer); this.pending.delete(message.id); pending.resolve(message); }
        }
      } catch { this.failAll('Non-JSON data on protocol stdout.'); }
    });
    this.child.on('error', () => this.failAll('Protocol process failed to start.'));
    this.child.on('exit', () => this.failAll('Protocol process exited before its response.'));
  }
  private failAll(message: string) {
    for (const p of this.pending.values()) { clearTimeout(p.timer); p.reject(new Error(message)); }
    this.pending.clear();
  }
  request(method: string, params?: unknown): Promise<any> {
    const id = ++this.id;
    const message = { jsonrpc: '2.0', id, method, ...(params === undefined ? {} : { params }) };
    this.trace.push({ direction: 'client', message });
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('Protocol request timed out.')); }, 20_000);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(JSON.stringify(message) + '\n');
    });
  }
  async initialise() {
    const result = await this.request('initialize', { protocolVersion: LATEST_PROTOCOL_VERSION,
      capabilities: {}, clientInfo: { name: 'raw-practice-02', version: '1.0.0' } });
    this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
    return result;
  }
  async close() {
    this.failAll('Protocol session closed.');
    if (this.child.exitCode !== null) return;
    const ended = once(this.child, 'exit');
    if (process.platform !== 'win32' && this.child.pid) {
      try { process.kill(-this.child.pid, 'SIGTERM'); } catch { this.child.kill('SIGTERM'); }
    } else this.child.kill('SIGTERM');
    const kill = setTimeout(() => {
      if (process.platform !== 'win32' && this.child.pid) {
        try { process.kill(-this.child.pid, 'SIGKILL'); } catch { /* already exited */ }
      } else this.child.kill('SIGKILL');
    }, 1_000);
    await ended;
    clearTimeout(kill);
  }
}
