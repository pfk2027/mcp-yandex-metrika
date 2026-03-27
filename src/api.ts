import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "./config.js";

// --- Error types ---

/** Classifies HTTP errors as retryable (429, 5xx) or permanent. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly method: string,
    public readonly path: string,
    public readonly body: string,
  ) {
    const truncated = body.length > 500 ? body.slice(0, 500) + "..." : body;
    super(`API ${status} ${method} /${path}: ${truncated}`);
    this.name = "HttpError";
  }

  get isRetryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

// --- Types ---

export type ManagementFn = (
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  params?: Record<string, string>,
  body?: unknown,
) => Promise<unknown>;

export type StatFn = (
  endpoint: string,
  params: Record<string, string>,
) => Promise<unknown>;

/** MCP error response (invalid input, parse failure, etc.). */
export type McpError = { content: Array<{ type: "text"; text: string }> };

/** Shared context passed to every tool module. */
export interface Ctx {
  server: McpServer;
  /** Calls Management API: `mgmt("GET", "counters", { per_page: "10" })` */
  mgmt: ManagementFn;
  /** Calls Stat API: `stat("", { ids: "123", metrics: "ym:s:visits" })` */
  stat: StatFn;
  /** Wraps data into MCP response format. */
  fmt: typeof formatResult;
  /** Safely parses JSON string. Returns `[parsed, null]` on success or `[null, errorResponse]` on failure. */
  parseJson: typeof parseJsonSafe;
}

// --- Constants ---

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 1_000;

// --- Path validation ---

const PATH_PATTERN = /^[a-zA-Z0-9_/]+$/;

function validatePath(path: string): void {
  if (!path || path.includes("..") || path.includes("//") || !PATH_PATTERN.test(path)) {
    throw new Error(`Invalid API path: "${path}"`);
  }
}

// --- Retry helper ---

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
      if (e instanceof HttpError && e.isRetryable && attempt < retries) {
        const delay = RETRY_BASE_MS * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw e;
    }
  }
  throw lastError;
}

// --- Param setter (avoids Object.entries allocation) ---

function setParams(url: URL, params: Record<string, string>): void {
  const keys = Object.keys(params);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const v = params[k];
    if (v !== undefined && v !== "") url.searchParams.set(k, v);
  }
}

// --- Management API ---

export function createManagementCall(cfg: Config): ManagementFn {
  const headers: Record<string, string> = {
    "Authorization": `OAuth ${cfg.token}`,
    "Content-Type": "application/json",
  };

  return (method, path, params, body) => {
    validatePath(path);

    return withRetry(async () => {
      const url = new URL(`${cfg.managementBase}/${path}`);
      if (params) setParams(url, params);

      const opts: RequestInit = {
        method,
        headers,
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      };
      if (body && (method === "POST" || method === "PUT")) {
        opts.body = JSON.stringify(body);
      }

      const res = await fetch(url.toString(), opts);

      if (method === "DELETE" && res.status === 204) {
        return { success: true };
      }

      if (!res.ok) {
        const text = await res.text();
        throw new HttpError(res.status, method, path, text);
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        return res.json();
      }
      return { raw: await res.text() };
    });
  };
}

// --- Stat API ---

export function createStatCall(cfg: Config): StatFn {
  const headers: Record<string, string> = {
    "Authorization": `OAuth ${cfg.token}`,
  };

  return (endpoint, params) => {
    return withRetry(async () => {
      const url = new URL(`${cfg.statBase}/data${endpoint}`);
      setParams(url, params);

      const res = await fetch(url.toString(), {
        headers,
        signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new HttpError(res.status, "GET", `stat/data${endpoint}`, text);
      }

      return res.json();
    });
  };
}

// --- Helpers ---

/** Wraps any data into MCP tool response format. */
export function formatResult(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

/** Safely parses a JSON string. Returns `[parsed, null]` on success or `[null, errorResponse]` on failure. */
export function parseJsonSafe(data: string): [unknown, null] | [null, McpError] {
  if (!data?.trim()) {
    return [null, { content: [{ type: "text" as const, text: "Error: empty JSON input." }] }];
  }
  try {
    return [JSON.parse(data), null];
  } catch (e) {
    return [null, { content: [{ type: "text" as const, text: `Error: invalid JSON — ${e instanceof Error ? e.message : e}` }] }];
  }
}

/** Creates the shared context object used by all tool modules. */
export function createCtx(server: McpServer, mgmt: ManagementFn, stat: StatFn): Ctx {
  return { server, mgmt, stat, fmt: formatResult, parseJson: parseJsonSafe };
}
