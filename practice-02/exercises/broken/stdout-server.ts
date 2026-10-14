import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createWorkspaceServer } from "../../src/servers/workspace.js";

// Only the explicitly selected demonstration writes a diagnostic line to stdout.
// Ordinary workspace-lab never imports this entry point.
if (!process.argv.includes("--selected=E09")) {
  console.error("Select E09 through npm run lab:broken -- --case E09.");
  process.exitCode = 1;
} else {
  console.log("LAB_DEBUG: stdout is reserved for MCP JSON-RPC");
  await (await createWorkspaceServer({ variant: "reference" })).connect(new StdioServerTransport());
}
