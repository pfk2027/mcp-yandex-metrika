import { z } from "zod";

// --- Entity IDs ---

export const counterId = z.number().describe("Counter ID");
export const goalId = z.number().describe("Goal ID");
export const filterId = z.number().describe("Filter ID");
export const operationId = z.number().describe("Operation ID");
export const segmentId = z.number().describe("Segment ID");
export const labelId = z.number().describe("Label ID");
export const requestId = z.number().describe("Log request ID");

// --- Stat common fields ---

export const ids = z.string().describe("Counter ID(s), comma-separated");

export const metrics = z.string().describe(
  "Comma-separated metrics: ym:s:visits, ym:s:users, ym:s:pageviews, ym:s:bounceRate, " +
  "ym:s:avgVisitDurationSeconds, ym:s:goal<ID>reaches, ym:s:goal<ID>conversionRate. " +
  "E-commerce: ym:s:ecommerceAddTransactionRevenue, ym:s:ecommerceAddTransactionCount. " +
  "Full list: https://yandex.com/dev/metrika/en/stat/dim-metrics",
);

export const dimensions = z.string().optional().describe(
  "Comma-separated dimensions: ym:s:date, ym:s:lastTrafficSource, ym:s:lastSignTrafficSource, " +
  "ym:s:UTMSource, ym:s:UTMCampaign, ym:s:lastDirectClickOrder, ym:s:regionCity, " +
  "ym:s:deviceCategory, ym:s:gender, ym:s:ageInterval, ym:s:browser, ym:s:operatingSystem, " +
  "ym:s:searchPhrase, ym:s:referer, ym:s:startURL, ym:s:endURL, etc.",
);

export const date1 = z.string().default("7daysAgo").describe("Start date: YYYY-MM-DD, today, yesterday, NdaysAgo");
export const date2 = z.string().default("today").describe("End date: YYYY-MM-DD, today, yesterday, NdaysAgo");

export const dateRequired1 = z.string().describe("Start date YYYY-MM-DD");
export const dateRequired2 = z.string().describe("End date YYYY-MM-DD");

export const filters = z.string().optional().describe("Filter expression, e.g. ym:s:lastSignTrafficSource=='ad'");
export const sort = z.string().optional().describe("Sort field with optional - prefix for descending, e.g. -ym:s:visits");

export const limit = z.number().min(1).max(10000).default(100).describe("Rows per page (max 10000)");
// Yandex Metrika API uses 1-based offset (first row = 1), unlike Direct which uses 0-based
export const offset = z.number().min(1).default(1).describe("Offset (1-based, per Metrika API spec)");

export const accuracy = z.enum(["low", "medium", "high", "full"]).default("full").describe("Sampling accuracy");
export const lang = z.enum(["ru", "en", "tr", "uk"]).optional().describe("Response language");

export const group = z.enum([
  "all", "auto", "minute", "dekaminute", "hour", "day", "week", "month", "quarter", "year",
]).default("day").describe("Time grouping interval");

// --- Management common fields ---

export const userLogin = z.string().describe("Yandex login of the user");
export const perm = z.enum(["view", "edit"]).describe("Permission level: view (read-only) or edit (full access)");
export const optionalComment = z.string().optional().describe("Optional comment");
export const activeDisabled = z.enum(["active", "disabled"]).default("active").describe("Status: active or disabled");

// --- Log API ---

export const logSource = z.enum(["visits", "hits"]).describe("Data source: visits (sessions) or hits (pageviews/events)");
export const logFields = z.string().describe(
  "Comma-separated fields. Visits: ym:s:date, ym:s:clientID, ym:s:visitDuration, ym:s:bounce, " +
  "ym:s:pageViews, ym:s:goalsID, ym:s:referer, ym:s:lastTrafficSource, ym:s:lastSearchPhrase, " +
  "ym:s:UTMSource, ym:s:UTMCampaign, ym:s:regionCity, ym:s:deviceCategory, ym:s:browser, ym:s:operatingSystem. " +
  "Hits: ym:pv:date, ym:pv:URL, ym:pv:title, ym:pv:referer, ym:pv:UTMSource. " +
  "Full list: https://yandex.com/dev/metrika/en/logs/fields",
);

// --- JSON data params (for update tools) ---

export const counterData = z.string().describe(
  'JSON object with counter fields to update. ' +
  'Fields: name (string), site (string), autogoals_enabled (0|1), mirrors2 ([{site}]). ' +
  'Example: {"name":"New name","autogoals_enabled":1}. ' +
  'Ref: https://yandex.com/dev/metrika/en/management/openapi/counter',
);

export const goalData = z.string().describe(
  'JSON object with goal fields to update. ' +
  'Fields: name (string), type (string), conditions ([{type,url}]), is_retargeting (0|1). ' +
  'Example: {"name":"Purchase","conditions":[{"type":"contain","url":"thanks"}]}. ' +
  'Ref: https://yandex.com/dev/metrika/en/management/openapi/goal',
);

export const filterData = z.string().describe(
  'JSON object with filter fields. ' +
  'Fields: attr (ip|url|title|referer|uniq_id|client_ip|ip_net), type (equal|contain|start|interval), ' +
  'value (string), action (include|exclude), status (active|disabled). ' +
  'Example: {"value":"192.168.1.0/24","status":"active"}. ' +
  'Ref: https://yandex.com/dev/metrika/en/management/openapi/filter',
);

export const operationData = z.string().describe(
  'JSON object with operation fields. ' +
  'Fields: action (cut_parameter|cut_fragment|replace_domain|replace_path|merge_https_and_http), ' +
  'attr (url|referer), value (string), status (active|disabled). ' +
  'Example: {"value":"utm_content","status":"active"}. ' +
  'Ref: https://yandex.com/dev/metrika/en/management/openapi/operation',
);

export const segmentData = z.string().describe(
  'JSON object with segment fields. ' +
  'Fields: name (string), expression (string — Metrika filter expression). ' +
  'Example: {"name":"Moscow users","expression":"ym:s:regionCity==213"}. ' +
  'Ref: https://yandex.com/dev/metrika/en/management/openapi/segment',
);
