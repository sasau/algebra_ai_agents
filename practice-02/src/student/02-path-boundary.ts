import { fail, type Result } from "../core/result.js";

// TODO 2: decide whether the canonical candidate is inside root using a separator.
// This guard runs for both the lexical path and realpath's resolved symlink target.
export function pathBoundary(_root: string, _candidate: string): Result<boolean> {
  return fail("NOT_IMPLEMENTED", "Complete TODO 2: enforce the fixture path boundary.");
}
