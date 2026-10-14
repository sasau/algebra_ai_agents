import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Workspace } from "../core/workspace.js";
import { toMcp } from "../core/result.js";
import { readerDescription, readerInputSchema } from "./01-reader-schema.js";

export function registerReader(server: McpServer, workspace: Workspace): void {
  server.registerTool("read_file", {
    description: readerDescription,
    inputSchema: readerInputSchema,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async (input) => toMcp(await workspace.readFile(input)));
}
