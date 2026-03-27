import { z } from "zod";
import type { Ctx } from "../api.js";
import * as S from "../schemas.js";

export function register(ctx: Ctx): void {
  const { server, mgmt, fmt, parseJson } = ctx;

  // ==================== FILTERS ====================

  server.registerTool("filters_get", {
    description: "List all traffic filters for a counter. Filters exclude unwanted traffic (own IPs, bots, etc.).",
    inputSchema: {
      counterId: S.counterId,
    },
  }, async ({ counterId }) => {
    return fmt(await mgmt("GET", `counter/${counterId}/filters`));
  });

  server.registerTool("filter_info", {
    description: "Get details of a specific filter.",
    inputSchema: {
      counterId: S.counterId,
      filterId: S.filterId,
    },
  }, async ({ counterId, filterId }) => {
    return fmt(await mgmt("GET", `counter/${counterId}/filter/${filterId}`));
  });

  server.registerTool("filter_create", {
    description: "Create a traffic filter. Exclude IPs, referrers, URLs, or title patterns from statistics.",
    inputSchema: {
      counterId: S.counterId,
      attr: z.enum([
        "ip", "url", "title", "referer", "uniq_id",
        "client_ip", "ip_net",
      ]).describe("Filter attribute: ip (single IP), ip_net (IP range/CIDR), url (page URL), title (page title), referer (referrer URL), uniq_id (Yandex cookie ID — exclude specific users), client_ip (visitor IP from X-Forwarded-For)"),
      type: z.enum(["equal", "contain", "start", "interval", "only_mirrors"]).describe("Match type"),
      value: z.string().describe("Filter value (IP address, URL pattern, etc.)"),
      action: z.enum(["include", "exclude"]).default("exclude").describe("Include or exclude matching traffic"),
      status: S.activeDisabled,
    },
  }, async ({ counterId, attr, type, value, action, status }) => {
    return fmt(await mgmt("POST", `counter/${counterId}/filters`, undefined, {
      filter: { attr, type, value, action, status },
    }));
  });

  server.registerTool("filter_update", {
    description: "Update an existing traffic filter.",
    inputSchema: {
      counterId: S.counterId,
      filterId: S.filterId,
      data: S.filterData,
    },
  }, async ({ counterId, filterId, data }) => {
    const [parsed, err] = parseJson(data);
    if (err) return err;
    return fmt(await mgmt("PUT", `counter/${counterId}/filter/${filterId}`, undefined, { filter: parsed }));
  });

  server.registerTool("filter_delete", {
    description: "Delete a traffic filter.",
    inputSchema: {
      counterId: S.counterId,
      filterId: S.filterId,
    },
  }, async ({ counterId, filterId }) => {
    return fmt(await mgmt("DELETE", `counter/${counterId}/filter/${filterId}`));
  });

  // ==================== OPERATIONS (URL rewriting) ====================

  server.registerTool("operations_get", {
    description: "List URL rewriting operations for a counter. Operations transform page URLs in reports (e.g., strip query params, merge pages).",
    inputSchema: {
      counterId: S.counterId,
    },
  }, async ({ counterId }) => {
    return fmt(await mgmt("GET", `counter/${counterId}/operations`));
  });

  server.registerTool("operation_info", {
    description: "Get details of a specific URL rewriting operation.",
    inputSchema: {
      counterId: S.counterId,
      operationId: S.operationId,
    },
  }, async ({ counterId, operationId }) => {
    return fmt(await mgmt("GET", `counter/${counterId}/operation/${operationId}`));
  });

  server.registerTool("operation_create", {
    description: "Create a URL rewriting operation. Transforms page URLs in reports.",
    inputSchema: {
      counterId: S.counterId,
      action: z.enum(["cut_parameter", "cut_fragment", "replace_domain", "replace_path", "merge_https_and_http"]).describe("Operation type"),
      attr: z.enum(["url", "referer"]).default("url").describe("Apply to page URL or referrer"),
      value: z.string().describe("Operation value (parameter name for cut_parameter, domain for replace_domain, etc.)"),
      status: S.activeDisabled,
    },
  }, async ({ counterId, action, attr, value, status }) => {
    return fmt(await mgmt("POST", `counter/${counterId}/operations`, undefined, {
      operation: { action, attr, value, status },
    }));
  });

  server.registerTool("operation_update", {
    description: "Update a URL rewriting operation.",
    inputSchema: {
      counterId: S.counterId,
      operationId: S.operationId,
      data: S.operationData,
    },
  }, async ({ counterId, operationId, data }) => {
    const [parsed, err] = parseJson(data);
    if (err) return err;
    return fmt(await mgmt("PUT", `counter/${counterId}/operation/${operationId}`, undefined, { operation: parsed }));
  });

  server.registerTool("operation_delete", {
    description: "Delete a URL rewriting operation.",
    inputSchema: {
      counterId: S.counterId,
      operationId: S.operationId,
    },
  }, async ({ counterId, operationId }) => {
    return fmt(await mgmt("DELETE", `counter/${counterId}/operation/${operationId}`));
  });
}
