import { z } from "zod";
import type { Ctx } from "../api.js";
import * as S from "../schemas.js";

export function register(ctx: Ctx): void {
  const { server, mgmt, fmt } = ctx;

  // ==================== LOG API (raw visits/hits data) ====================
  // Rate limits apply. Check https://yandex.com/dev/metrika/en/intro/quotas before bulk operations.

  server.registerTool("logrequest_estimate", {
    description: "Estimate the size of a log request before creating it. Returns whether the request is possible and estimated row count.",
    inputSchema: {
      counterId: S.counterId,
      date1: S.dateRequired1,
      date2: S.dateRequired2,
      source: S.logSource,
      fields: S.logFields,
    },
  }, async ({ counterId, date1, date2, source, fields }) => {
    return fmt(await mgmt("GET", `counter/${counterId}/logrequests/evaluate`, {
      date1, date2, source, fields,
    }));
  });

  server.registerTool("logrequest_create", {
    description: "Create a log request to download raw visits or hits data. After creation, check status with logrequest_info until 'processed'.",
    inputSchema: {
      counterId: S.counterId,
      date1: S.dateRequired1,
      date2: S.dateRequired2,
      source: S.logSource,
      fields: z.string().describe("Comma-separated field names (see logrequest_estimate for available fields)"),
    },
  }, async ({ counterId, date1, date2, source, fields }) => {
    return fmt(await mgmt("POST", `counter/${counterId}/logrequests`, { date1, date2, source, fields }));
  });

  server.registerTool("logrequest_info", {
    description: "Check the status of a log request. Status flow: created → processed (ready to download) or canceled.",
    inputSchema: {
      counterId: S.counterId,
      requestId: S.requestId,
    },
  }, async ({ counterId, requestId }) => {
    return fmt(await mgmt("GET", `counter/${counterId}/logrequest/${requestId}`));
  });

  server.registerTool("logrequests_list", {
    description: "List all log requests for a counter. Shows request IDs, statuses, date ranges.",
    inputSchema: {
      counterId: S.counterId,
    },
  }, async ({ counterId }) => {
    return fmt(await mgmt("GET", `counter/${counterId}/logrequests`));
  });

  server.registerTool("logrequest_download", {
    description: "Download a part of a processed log request. Returns raw TSV data. Large requests are split into parts (0, 1, 2...).",
    inputSchema: {
      counterId: S.counterId,
      requestId: S.requestId,
      partNumber: z.number().default(0).describe("Part number (0-based). Check logrequest_info for total parts."),
    },
  }, async ({ counterId, requestId, partNumber }) => {
    return fmt(await mgmt("GET", `counter/${counterId}/logrequest/${requestId}/part/${partNumber}/download`));
  });

  server.registerTool("logrequest_clean", {
    description: "Clean up (delete) a processed log request to free storage. Cannot be undone.",
    inputSchema: {
      counterId: S.counterId,
      requestId: S.requestId,
    },
  }, async ({ counterId, requestId }) => {
    return fmt(await mgmt("POST", `counter/${counterId}/logrequest/${requestId}/clean`));
  });

  server.registerTool("logrequest_cancel", {
    description: "Cancel a pending log request that hasn't been processed yet.",
    inputSchema: {
      counterId: S.counterId,
      requestId: S.requestId,
    },
  }, async ({ counterId, requestId }) => {
    return fmt(await mgmt("POST", `counter/${counterId}/logrequest/${requestId}/cancel`));
  });
}
