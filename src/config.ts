/** Validated configuration for the Yandex Metrika MCP server. */
export interface Config {
  /** OAuth token for Yandex Metrika API. */
  token: string;
  /** Base URL for Management API v1. */
  managementBase: string;
  /** Base URL for Stat API v1. */
  statBase: string;
}

/**
 * Loads and validates configuration from environment variables.
 * Exits with error code 1 if YANDEX_METRIKA_TOKEN is missing.
 *
 * Env vars:
 *   YANDEX_METRIKA_TOKEN       — (required) OAuth token
 *   YANDEX_METRIKA_MGMT_BASE   — override Management API base URL
 *   YANDEX_METRIKA_STAT_BASE   — override Stat API base URL
 */
export function loadConfig(): Config {
  const token = process.env.YANDEX_METRIKA_TOKEN ?? "";

  if (!token) {
    console.error(
      "ERROR: YANDEX_METRIKA_TOKEN is required.\n" +
      "Set it as an environment variable, in .mcp.json env section, or in ~/.env.keys\n" +
      "Get a token at https://oauth.yandex.ru/ with metrika:read (+ metrika:write for management) scope.",
    );
    process.exit(1);
  }

  const managementBase = process.env.YANDEX_METRIKA_MGMT_BASE
    ?? "https://api-metrika.yandex.net/management/v1";
  const statBase = process.env.YANDEX_METRIKA_STAT_BASE
    ?? "https://api-metrika.yandex.net/stat/v1";

  return { token, managementBase, statBase };
}
