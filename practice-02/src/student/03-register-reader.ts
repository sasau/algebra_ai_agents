import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Workspace } from "../core/workspace.js";
import { fail, toMcp } from "../core/result.js";
import { readerInputSchema } from "./01-reader-schema.js";

// TODO 3: adapt the shared reader to MCP. Complete TODOs 1 and 2 first.
// Preserve the five-tool discovery shape while this operation is incomplete.
export function registerReader(server: McpServer, _workspace: Workspace): void {
  server.registerTool("read_file", {
    description: "Incomplete student registration. Complete TODO 3 to call the shared bounded reader.",
    inputSchema: readerInputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async () => toMcp(fail("NOT_IMPLEMENTED", "Complete TODO 3: register the shared read_file handler.")));
}
