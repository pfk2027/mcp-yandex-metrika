import { z } from "zod";
import type { Ctx } from "../api.js";
import * as S from "../schemas.js";

export function register(ctx: Ctx): void {
  const { server, stat, fmt } = ctx;

  // ==================== TABLE REPORT ====================

  server.registerTool("stat_data", {
    description: "Get statistics table report. Main tool for analytics — visits, users, goals, bounce rate, etc. with any dimensions. Rate limits apply: https://yandex.com/dev/metrika/en/intro/quotas",
    inputSchema: {
      ids: S.ids,
      metrics: S.metrics,
      dimensions: S.dimensions,
      date1: S.date1,
      date2: S.date2,
      filters: S.filters,
      sort: S.sort,
      limit: S.limit,
      offset: S.offset,
      accuracy: S.accuracy,
      includeUndefined: z.boolean().default(true).describe("Include rows where dimension is undefined"),
      lang: S.lang,
    },
  }, async ({ ids, metrics, dimensions, date1, date2, filters, sort, limit, offset, accuracy, includeUndefined, lang }) => {
    const params: Record<string, string> = {
      ids, metrics, date1, date2,
      limit: String(limit),
      offset: String(offset),
      accuracy,
      include_undefined: String(includeUndefined),
    };
    if (dimensions) params.dimensions = dimensions;
    if (filters) params.filters = filters;
    if (sort) params.sort = sort;
    if (lang) params.lang = lang;
    return fmt(await stat("", params));
  });

  // ==================== TIME SERIES ====================

  server.registerTool("stat_bytime", {
    description: "Get time-series report (for charts). Returns metrics grouped by time intervals. Perfect for trend analysis.",
    inputSchema: {
      ids: S.ids,
      metrics: S.metrics,
      dimensions: S.dimensions,
      date1: S.date1,
      date2: S.date2,
      group: S.group,
      filters: S.filters,
      sort: S.sort,
      limit: z.number().min(1).max(30).default(7).describe("Max dimension rows"),
      accuracy: S.accuracy,
      lang: S.lang,
    },
  }, async ({ ids, metrics, dimensions, date1, date2, group, filters, sort, limit, accuracy, lang }) => {
    const params: Record<string, string> = {
      ids, metrics, date1, date2, group,
      limit: String(limit),
      accuracy,
    };
    if (dimensions) params.dimensions = dimensions;
    if (filters) params.filters = filters;
    if (sort) params.sort = sort;
    if (lang) params.lang = lang;
    return fmt(await stat("/bytime", params));
  });

  // ==================== COMPARISON ====================

  server.registerTool("stat_comparison", {
    description: "Compare two date ranges or segments side by side. Great for period-over-period analysis (e.g. this week vs last week).",
    inputSchema: {
      ids: S.ids,
      metrics: S.metrics,
      dimensions: S.dimensions,
      date1_a: z.string().describe("Segment A start date"),
      date2_a: z.string().describe("Segment A end date"),
      date1_b: z.string().describe("Segment B start date"),
      date2_b: z.string().describe("Segment B end date"),
      filters_a: z.string().optional().describe("Segment A filter expression"),
      filters_b: z.string().optional().describe("Segment B filter expression"),
      sort: S.sort,
      limit: S.limit,
      accuracy: S.accuracy,
      lang: S.lang,
    },
  }, async ({ ids, metrics, dimensions, date1_a, date2_a, date1_b, date2_b, filters_a, filters_b, sort, limit, accuracy, lang }) => {
    const params: Record<string, string> = {
      ids, metrics,
      date1_a, date2_a, date1_b, date2_b,
      limit: String(limit),
      accuracy,
    };
    if (dimensions) params.dimensions = dimensions;
    if (filters_a) params.filters_a = filters_a;
    if (filters_b) params.filters_b = filters_b;
    if (sort) params.sort = sort;
    if (lang) params.lang = lang;
    return fmt(await stat("/comparison", params));
  });

  // ==================== DRILLDOWN ====================

  server.registerTool("stat_drilldown", {
    description: "Drill-down tree report. Expand hierarchical dimensions level by level (e.g. country → region → city, or traffic source → campaign → keyword).",
    inputSchema: {
      ids: S.ids,
      metrics: S.metrics,
      dimensions: z.string().describe("Comma-separated hierarchical dimensions"),
      date1: S.date1,
      date2: S.date2,
      parentId: z.string().optional().describe('JSON array of parent keys to expand next level, e.g. ["Russia"] or ["ad","yandex"]'),
      filters: S.filters,
      sort: S.sort,
      limit: S.limit,
      accuracy: S.accuracy,
      lang: S.lang,
    },
  }, async ({ ids, metrics, dimensions, date1, date2, parentId, filters, sort, limit, accuracy, lang }) => {
    const params: Record<string, string> = {
      ids, metrics, dimensions, date1, date2,
      limit: String(limit),
      accuracy,
    };
    if (parentId) params.parent_id = parentId;
    if (filters) params.filters = filters;
    if (sort) params.sort = sort;
    if (lang) params.lang = lang;
    return fmt(await stat("/drilldown", params));
  });

  // ==================== COMPARISON DRILLDOWN ====================

  server.registerTool("stat_comparison_drilldown", {
    description: "Drill-down tree report with comparison of two segments/periods. Combines drilldown hierarchy with side-by-side comparison.",
    inputSchema: {
      ids: S.ids,
      metrics: S.metrics,
      dimensions: z.string().describe("Comma-separated hierarchical dimensions"),
      date1_a: z.string().describe("Segment A start date"),
      date2_a: z.string().describe("Segment A end date"),
      date1_b: z.string().describe("Segment B start date"),
      date2_b: z.string().describe("Segment B end date"),
      parentId: z.string().optional().describe("JSON array of parent keys to expand"),
      filters_a: z.string().optional().describe("Segment A filter"),
      filters_b: z.string().optional().describe("Segment B filter"),
      sort: S.sort,
      limit: S.limit,
      accuracy: S.accuracy,
      lang: S.lang,
    },
  }, async ({ ids, metrics, dimensions, date1_a, date2_a, date1_b, date2_b, parentId, filters_a, filters_b, sort, limit, accuracy, lang }) => {
    const params: Record<string, string> = {
      ids, metrics, dimensions,
      date1_a, date2_a, date1_b, date2_b,
      limit: String(limit),
      accuracy,
    };
    if (parentId) params.parent_id = parentId;
    if (filters_a) params.filters_a = filters_a;
    if (filters_b) params.filters_b = filters_b;
    if (sort) params.sort = sort;
    if (lang) params.lang = lang;
    return fmt(await stat("/comparison/drilldown", params));
  });
}
