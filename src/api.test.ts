import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  HttpError, createManagementCall, createStatCall,
  formatResult, parseJsonSafe, createCtx,
} from "./api.js";
import type { Config } from "./config.js";

// --- Mock fetch globally ---
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function makeConfig(overrides: Partial<Config> = {}): Config {
  return {
    token: "test-token-metrika",
    managementBase: "https://api-metrika.yandex.net/management/v1",
    statBase: "https://api-metrika.yandex.net/stat/v1",
    ...overrides,
  };
}

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => headers[name] ?? null,
    },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  };
}

function textResponse(text: string, status = 200, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name: string) => headers[name] ?? null,
    },
    json: () => Promise.reject(new Error("not json")),
    text: () => Promise.resolve(text),
  };
}

beforeEach(() => mockFetch.mockReset());
afterEach(() => vi.restoreAllMocks());

// ===========================
// HttpError
// ===========================

describe("HttpError", () => {
  it("creates error with sanitized message", () => {
    const err = new HttpError(400, "GET", "counters", "raw body details");
    expect(err.message).toContain("API error 400");
    expect(err.message).toContain("GET");
    expect(err.message).not.toContain("raw body");
    expect(err.name).toBe("HttpError");
  });

  it("preserves raw body in .body property", () => {
    const err = new HttpError(500, "POST", "goals", "internal error details");
    expect(err.body).toBe("internal error details");
  });

  it("marks 429 as retryable", () => {
    expect(new HttpError(429, "GET", "/", "").isRetryable).toBe(true);
  });

  it("marks 500 as retryable", () => {
    expect(new HttpError(500, "GET", "/", "").isRetryable).toBe(true);
  });

  it("marks 502 as retryable", () => {
    expect(new HttpError(502, "GET", "/", "").isRetryable).toBe(true);
  });

  it("marks 400 as NOT retryable", () => {
    expect(new HttpError(400, "GET", "/", "").isRetryable).toBe(false);
  });

  it("marks 403 as NOT retryable", () => {
    expect(new HttpError(403, "GET", "/", "").isRetryable).toBe(false);
  });

  it("marks 404 as NOT retryable", () => {
    expect(new HttpError(404, "GET", "/", "").isRetryable).toBe(false);
  });
});

// ===========================
// formatResult
// ===========================

describe("formatResult", () => {
  it("wraps object data", () => {
    const result = formatResult({ counters: [{ id: 1 }] });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual({ counters: [{ id: 1 }] });
  });

  it("wraps null", () => {
    expect(JSON.parse(formatResult(null).content[0].text)).toBeNull();
  });

  it("wraps array", () => {
    expect(JSON.parse(formatResult([1, 2]).content[0].text)).toEqual([1, 2]);
  });
});

// ===========================
// parseJsonSafe
// ===========================

describe("parseJsonSafe", () => {
  it("returns parsed data for valid JSON", () => {
    const [data, err] = parseJsonSafe('{"key":"value"}');
    expect(data).toEqual({ key: "value" });
    expect(err).toBeNull();
  });

  it("returns error for empty string", () => {
    const [data, err] = parseJsonSafe("");
    expect(data).toBeNull();
    expect(err!.content[0].text).toContain("empty JSON");
  });

  it("returns error for whitespace-only string", () => {
    const [data, err] = parseJsonSafe("   ");
    expect(data).toBeNull();
    expect(err!.content[0].text).toContain("empty JSON");
  });

  it("returns sanitized error for invalid JSON", () => {
    const [data, err] = parseJsonSafe("{broken");
    expect(data).toBeNull();
    expect(err!.content[0].text).toContain("invalid JSON");
    // Must NOT contain parser internals
    expect(err!.content[0].text).not.toContain("Unexpected");
    expect(err!.content[0].text).not.toContain("position");
  });

  it("parses arrays", () => {
    const [data] = parseJsonSafe("[1,2,3]");
    expect(data).toEqual([1, 2, 3]);
  });

  it("parses primitives", () => {
    const [data] = parseJsonSafe("42");
    expect(data).toBe(42);
  });
});

// ===========================
// createManagementCall
// ===========================

describe("createManagementCall", () => {
  it("sends GET request with correct URL and headers", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(
      { counters: [] },
      200,
      { "content-type": "application/json" },
    ));

    const mgmt = createManagementCall(makeConfig());
    await mgmt("GET", "counters", { per_page: "10" });

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toContain("/management/v1/counters");
    expect(url).toContain("per_page=10");
    expect(opts.method).toBe("GET");
    expect(opts.headers["Authorization"]).toBe("OAuth test-token-metrika");
  });

  it("sends POST with body for POST method", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse(
      { counter: { id: 1 } },
      200,
      { "content-type": "application/json" },
    ));

    const mgmt = createManagementCall(makeConfig());
    await mgmt("POST", "counters", {}, { counter: { name: "Test", site: "test.com" } });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.counter.name).toBe("Test");
  });

  it("sends PUT with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 200, { "content-type": "application/json" }));
    const mgmt = createManagementCall(makeConfig());
    await mgmt("PUT", "counter/123", {}, { counter: { name: "Updated" } });
    expect(JSON.parse(mockFetch.mock.calls[0][1].body).counter.name).toBe("Updated");
  });

  it("does NOT send body for GET with body param", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 200, { "content-type": "application/json" }));
    const mgmt = createManagementCall(makeConfig());
    await mgmt("GET", "counters", {}, { ignored: true });
    expect(mockFetch.mock.calls[0][1].body).toBeUndefined();
  });

  it("returns { success: true } for DELETE 204", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 204,
      headers: { get: () => null },
      text: () => Promise.resolve(""),
    });
    const mgmt = createManagementCall(makeConfig());
    const result = await mgmt("DELETE", "counter/123");
    expect(result).toEqual({ success: true });
  });

  it("returns raw text for non-JSON response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true, status: 200,
      headers: { get: (n: string) => n === "content-type" ? "text/plain" : null },
      text: () => Promise.resolve("raw csv data"),
    });
    const mgmt = createManagementCall(makeConfig());
    const result = await mgmt("GET", "counter/123/logrequest/1/part/0/download") as { raw: string };
    expect(result.raw).toBe("raw csv data");
  });

  it("throws HttpError on failure", async () => {
    mockFetch.mockResolvedValueOnce(textResponse("error body", 403));
    const mgmt = createManagementCall(makeConfig());
    await expect(mgmt("GET", "counters")).rejects.toThrow(HttpError);
    try {
      await mgmt("GET", "counters");
    } catch (e) {
      if (e instanceof HttpError) {
        expect(e.status).toBe(403);
        expect(e.body).toBe("error body");
        expect(e.message).not.toContain("error body");
      }
    }
  });

  it("rejects path traversal with ..", () => {
    const mgmt = createManagementCall(makeConfig());
    expect(() => mgmt("GET", "counter/../admin")).toThrow("Invalid API path");
  });

  it("rejects double slashes", () => {
    const mgmt = createManagementCall(makeConfig());
    expect(() => mgmt("GET", "counter//123")).toThrow("Invalid API path");
  });

  it("rejects empty path", () => {
    const mgmt = createManagementCall(makeConfig());
    expect(() => mgmt("GET", "")).toThrow("Invalid API path");
  });

  it("rejects special characters in path", () => {
    const mgmt = createManagementCall(makeConfig());
    expect(() => mgmt("GET", "counter/<script>")).toThrow("Invalid API path");
  });

  it("allows valid paths", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 200, { "content-type": "application/json" }));
    const mgmt = createManagementCall(makeConfig());
    await mgmt("GET", "counter/123/goals");
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("retries on 429", async () => {
    mockFetch
      .mockResolvedValueOnce(textResponse("rate limited", 429))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200, { "content-type": "application/json" }));

    const mgmt = createManagementCall(makeConfig());
    const result = await mgmt("GET", "counters");
    expect(result).toEqual({ ok: true });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("retries on 500", async () => {
    mockFetch
      .mockResolvedValueOnce(textResponse("server error", 500))
      .mockResolvedValueOnce(jsonResponse({ ok: true }, 200, { "content-type": "application/json" }));

    const mgmt = createManagementCall(makeConfig());
    const result = await mgmt("GET", "counters");
    expect(result).toEqual({ ok: true });
  });

  it("does NOT retry on 400", async () => {
    mockFetch.mockResolvedValue(textResponse("bad request", 400));
    const mgmt = createManagementCall(makeConfig());
    await expect(mgmt("GET", "counters")).rejects.toThrow(HttpError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("throws after max retries exhausted", async () => {
    mockFetch.mockResolvedValue(textResponse("server error", 500));
    const mgmt = createManagementCall(makeConfig());
    await expect(mgmt("GET", "counters")).rejects.toThrow(HttpError);
    expect(mockFetch).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("skips empty params", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 200, { "content-type": "application/json" }));
    const mgmt = createManagementCall(makeConfig());
    await mgmt("GET", "counters", { a: "1", b: "", c: "3" });
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("a=1");
    expect(url).not.toContain("b=");
    expect(url).toContain("c=3");
  });
});

// ===========================
// createStatCall
// ===========================

describe("createStatCall", () => {
  it("sends GET request with params", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [], totals: [100] }, 200));
    const stat = createStatCall(makeConfig());
    await stat("", { ids: "123", metrics: "ym:s:visits" });

    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("/stat/v1/data");
    expect(url).toContain("ids=123");
    expect(url).toContain("metrics=");
  });

  it("appends endpoint to base URL", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}, 200));
    const stat = createStatCall(makeConfig());
    await stat("/bytime", { ids: "1" });
    expect(mockFetch.mock.calls[0][0]).toContain("/stat/v1/data/bytime");
  });

  it("throws HttpError on failure", async () => {
    mockFetch.mockResolvedValueOnce(textResponse("not found", 404));
    const stat = createStatCall(makeConfig());
    await expect(stat("", { ids: "1" })).rejects.toThrow(HttpError);
  });

  it("retries on 500", async () => {
    mockFetch
      .mockResolvedValueOnce(textResponse("err", 500))
      .mockResolvedValueOnce(jsonResponse({ data: [] }, 200));

    const stat = createStatCall(makeConfig());
    await stat("", { ids: "1" });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

// ===========================
// createCtx
// ===========================

describe("createCtx", () => {
  it("creates context with all required fields", () => {
    const mockServer = {} as any;
    const mgmt = vi.fn() as any;
    const stat = vi.fn() as any;
    const ctx = createCtx(mockServer, mgmt, stat);

    expect(ctx.server).toBe(mockServer);
    expect(ctx.mgmt).toBe(mgmt);
    expect(ctx.stat).toBe(stat);
    expect(ctx.fmt).toBe(formatResult);
    expect(ctx.parseJson).toBe(parseJsonSafe);
  });
});
