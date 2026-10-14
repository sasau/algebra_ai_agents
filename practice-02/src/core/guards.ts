import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { fail, ok, type Result } from "./result.js";

export const FILE_BYTE_LIMIT = 20_000;
export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function containsPath(root: string, candidate: string): boolean {
  // A separator matters: /fixture-private does not belong to /fixture.
  return candidate === root || candidate.startsWith(root + path.sep);
}

export type ResolvedPath = { absolute: string; relative: string };
export async function resolveInRoot(
  root: string,
  supplied: string,
  kind: "file" | "directory",
  boundary: (root: string, candidate: string) => Result<boolean> =
    (root, candidate) => ok(containsPath(root, candidate)),
): Promise<Result<ResolvedPath>> {
  if (typeof supplied !== "string" || supplied.length > 240 || supplied.includes("\0")) {
    return fail("INVALID_INPUT", "A path must be a string of at most 240 characters without NUL bytes.");
  }
  // The public contract uses relative POSIX paths on every supported platform.
  if (path.isAbsolute(supplied) || /^[A-Za-z]:/.test(supplied) || supplied.includes("\\")) {
    return fail("PATH_DENIED", "Only relative paths inside the fixture are permitted.");
  }
  const lexical = path.resolve(root, supplied || ".");
  const lexicalDecision = boundary(root, lexical);
  if (!lexicalDecision.ok) return lexicalDecision;
  if (!lexicalDecision.value) return fail("PATH_DENIED", "The requested path leaves the fixture.");
  try {
    const canonical = await realpath(lexical);
    const canonicalDecision = boundary(root, canonical);
    if (!canonicalDecision.ok) return canonicalDecision;
    if (!canonicalDecision.value) return fail("PATH_DENIED", "The symlink target leaves the fixture.");
    const info = await stat(canonical);
    if (kind === "file" && !info.isFile()) return fail("NOT_A_FILE", "Only regular files may be read.");
    if (kind === "directory" && !info.isDirectory()) return fail("NOT_A_DIRECTORY", "A directory is required.");
    return ok({ absolute: canonical, relative: path.relative(root, canonical).split(path.sep).join("/") || "." });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") return fail("NOT_FOUND", "The requested path does not exist.");
    if (code === "ELOOP") return fail("PATH_DENIED", "A symlink loop is not permitted.");
    return fail("IO_ERROR", "The fixture path could not be inspected.", code === "EMFILE" || code === "ENFILE");
  }
}

/** Trim at most three bytes from a capped UTF-8 prefix; never split a code point. */
export function decodeUtf8Prefix(buffer: Buffer, limit: number, truncated: boolean): Result<string> {
  const prefix = buffer.subarray(0, limit);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (let trim = 0; trim <= (truncated ? 3 : 0); trim += 1) {
    try { return ok(decoder.decode(prefix.subarray(0, prefix.length - trim))); }
    catch { /* A cut multibyte character may be completed outside the returned prefix. */ }
  }
  return fail("INVALID_ENCODING", "The requested file does not contain valid UTF-8 text.");
}
