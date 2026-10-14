import path from "node:path";
import { ok, type Result } from "../core/result.js";

export function pathBoundary(root: string, candidate: string): Result<boolean> {
  return ok(candidate === root || candidate.startsWith(root + path.sep));
}
