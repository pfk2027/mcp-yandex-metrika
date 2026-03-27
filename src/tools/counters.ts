import { z } from "zod";
import type { Ctx } from "../api.js";
import * as S from "../schemas.js";

export function register(ctx: Ctx): void {
  const { server, mgmt, fmt, parseJson } = ctx;

  // ==================== COUNTERS ====================

  server.registerTool("counters_get", {
    description: "List all Metrika counters available to the authenticated user. Returns counter IDs, names, sites, status.",
    inputSchema: {
      searchString: z.string().optional().describe("Search by counter name or URL"),
      status: z.enum(["Active", "Deleted"]).optional().describe("Filter by status"),
      type: z.enum(["simple", "partner"]).optional().describe("Counter type"),
      sort: z.enum(["None", "Default", "Visits", "Hits", "Uniques", "Name"]).default("Default").describe("Sort order"),
      perPage: z.number().min(1).max(10000).default(100).describe("Results per page"),
      offset: S.offset,
    },
  }, async ({ searchString, status, type, sort, perPage, offset }) => {
    const params: Record<string, string> = {
      per_page: String(perPage),
      offset: String(offset),
      sort,
      field: "goals,mirrors",
    };
    if (searchString) params.search_string = searchString;
    if (status) params.status = status;
    if (type) params.type = type;
    return fmt(await mgmt("GET", "counters", params));
  });

  server.registerTool("counter_info", {
    description: "Get detailed info about a specific counter including goals, mirrors, grants, filters, operations.",
    inputSchema: {
      counterId: S.counterId,
      field: z.string().default("goals,mirrors,grants,filters,operations").describe("Comma-separated fields to include"),
    },
  }, async ({ counterId, field }) => {
    return fmt(await mgmt("GET", `counter/${counterId}`, { field }));
  });

  server.registerTool("counter_create", {
    description: "Create a new Metrika counter for a website.",
    inputSchema: {
      site: z.string().describe("Website URL (e.g. example.com)"),
      name: z.string().describe("Counter name"),
      autogoals: z.boolean().default(true).describe("Enable automatic goals (form submissions, button clicks, etc.)"),
      informer: z.boolean().default(false).describe("Show informer widget on site"),
      mirrors: z.array(z.string()).optional().describe("Mirror domains (e.g. [\"www.example.com\"])"),
    },
  }, async ({ site, name, autogoals, informer, mirrors }) => {
    const body: Record<string, unknown> = {
      counter: {
        site,
        name,
        autogoals_enabled: autogoals ? 1 : 0,
        code_options: { informer: { enabled: informer ? 1 : 0 } },
      },
    };
    if (mirrors?.length) {
      (body.counter as Record<string, unknown>).mirrors2 = mirrors.map((d) => ({ site: d }));
    }
    return fmt(await mgmt("POST", "counters", undefined, body));
  });

  server.registerTool("counter_update", {
    description: "Update counter settings (name, mirrors, autogoals, etc.).",
    inputSchema: {
      counterId: S.counterId,
      data: S.counterData,
    },
  }, async ({ counterId, data }) => {
    const [parsed, err] = parseJson(data);
    if (err) return err;
    return fmt(await mgmt("PUT", `counter/${counterId}`, undefined, { counter: parsed }));
  });

  server.registerTool("counter_delete", {
    description: "Delete a counter. Can be restored within 30 days using counter_undelete.",
    inputSchema: {
      counterId: S.counterId,
    },
  }, async ({ counterId }) => {
    return fmt(await mgmt("DELETE", `counter/${counterId}`));
  });

  server.registerTool("counter_undelete", {
    description: "Restore a previously deleted counter (within 30 days of deletion).",
    inputSchema: {
      counterId: S.counterId,
    },
  }, async ({ counterId }) => {
    return fmt(await mgmt("POST", `counter/${counterId}/undelete`));
  });

  // ==================== LABELS ====================

  server.registerTool("labels_get", {
    description: "List all labels (tags) for organizing counters.",
    inputSchema: {},
  }, async () => {
    return fmt(await mgmt("GET", "labels"));
  });

  server.registerTool("label_create", {
    description: "Create a new label for organizing counters.",
    inputSchema: {
      name: z.string().describe("Label name"),
    },
  }, async ({ name }) => {
    return fmt(await mgmt("POST", "labels", undefined, { label: { name } }));
  });

  server.registerTool("label_update", {
    description: "Rename an existing label.",
    inputSchema: {
      labelId: S.labelId,
      name: z.string().describe("New label name"),
    },
  }, async ({ labelId, name }) => {
    return fmt(await mgmt("PUT", `label/${labelId}`, undefined, { label: { name } }));
  });

  server.registerTool("label_delete", {
    description: "Delete a label. Does not delete associated counters.",
    inputSchema: {
      labelId: S.labelId,
    },
  }, async ({ labelId }) => {
    return fmt(await mgmt("DELETE", `label/${labelId}`));
  });

  server.registerTool("counter_label_set", {
    description: "Assign a label to a counter.",
    inputSchema: {
      counterId: S.counterId,
      labelId: S.labelId,
    },
  }, async ({ counterId, labelId }) => {
    return fmt(await mgmt("POST", `counter/${counterId}/label/${labelId}`));
  });

  server.registerTool("counter_label_remove", {
    description: "Remove a label from a counter.",
    inputSchema: {
      counterId: S.counterId,
      labelId: S.labelId,
    },
  }, async ({ counterId, labelId }) => {
    return fmt(await mgmt("DELETE", `counter/${counterId}/label/${labelId}`));
  });
}
