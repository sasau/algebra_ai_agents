/** The domain result is independent of MCP, a model provider, and a transport. */
export type Result<T = unknown> =
  | { ok: true; value: T }
  | { ok: false; error: { code: string; message: string; retryable: boolean } };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });
export const fail = (code: string, message: string, retryable = false): Result<never> =>
  ({ ok: false, error: { code, message, retryable } });

/** Expected execution errors use isError. SDK argument validation happens earlier. */
export function toMcp(result: Result) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(result) }],
    structuredContent: result as unknown as Record<string, unknown>,
    ...(result.ok ? {} : { isError: true }),
  };
}
