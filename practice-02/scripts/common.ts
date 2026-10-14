import { fileURLToPath } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Result } from '../src/core/result.js';
export const LAB = fileURLToPath(new URL('../', import.meta.url));
export const variant = () => process.env.LAB_VARIANT === 'reference' ? 'reference' as const : 'starter' as const;
export function requireValue<T>(result: Result<T>): T {
  if (!result.ok) throw new Error(`${result.error.code}: ${result.error.message}`);
  return result.value;
}
export async function evidence(name: string, value: unknown) {
  await mkdir(resolve(LAB, 'work/evidence'), { recursive: true });
  await writeFile(resolve(LAB, 'work/evidence', `${name}.json`),
    JSON.stringify({ capturedAt: new Date().toISOString(), node: process.version, variant: variant(), evidence: value }, null, 2) + '\n');
}
export function entryError(error: unknown) {
  // Domain failures are already sanitised. Unexpected errors do not print request/config objects.
  console.error(error instanceof Error && /^(NOT_IMPLEMENTED|NOT_FOUND|INVALID_INPUT|PATH_DENIED|DB_UNAVAILABLE):/.test(error.message)
    ? error.message : 'Verification could not finish. Run npm run doctor and check lab service readiness.');
  process.exitCode = 1;
}
