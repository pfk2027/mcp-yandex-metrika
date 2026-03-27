#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { createManagementCall, createStatCall, createCtx } from "./api.js";
import { register as registerCounters } from "./tools/counters.js";
import { register as registerGoals } from "./tools/goals.js";
import { register as registerFilters } from "./tools/filters.js";
import { register as registerAccess } from "./tools/access.js";
import { register as registerStat } from "./tools/stat.js";
import { register as registerLogRequests } from "./tools/logrequests.js";

async function main() {
  const config = loadConfig();

  const server = new McpServer({ name: "yandex-metrika", version: "2.0.0" });
  const mgmt = createManagementCall(config);
  const stat = createStatCall(config);
  const ctx = createCtx(server, mgmt, stat);

  // Register all tools (~50)
  registerCounters(ctx);      // counters (6) + labels (5) = 11
  registerGoals(ctx);         // goals (5)
  registerFilters(ctx);       // filters (5) + operations (5) = 10
  registerAccess(ctx);        // grants (4) + delegates (3) + accounts (1) + segments (5) = 13
  registerStat(ctx);          // stat table + bytime + comparison + drilldown + comparison/drilldown = 5
  registerLogRequests(ctx);   // estimate + create + info + list + download + clean + cancel = 7

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Yandex Metrika MCP server v2.0.0 running. Listening on stdio.");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
