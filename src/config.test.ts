import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadConfig } from "./config.js";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = { ...originalEnv };
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(process, "exit").mockImplementation((() => { throw new Error("process.exit"); }) as any);
});

afterEach(() => {
  process.env = originalEnv;
  vi.restoreAllMocks();
});

describe("loadConfig", () => {
  it("loads config with token", () => {
    process.env.YANDEX_METRIKA_TOKEN = "my-metrika-token";
    const cfg = loadConfig();
    expect(cfg.token).toBe("my-metrika-token");
    expect(cfg.managementBase).toContain("api-metrika.yandex.net");
    expect(cfg.statBase).toContain("api-metrika.yandex.net");
  });

  it("exits on missing token", () => {
    delete process.env.YANDEX_METRIKA_TOKEN;
    expect(() => loadConfig()).toThrow("process.exit");
  });

  it("allows management base URL override", () => {
    process.env.YANDEX_METRIKA_TOKEN = "tok";
    process.env.YANDEX_METRIKA_MGMT_BASE = "https://custom.api/mgmt";
    expect(loadConfig().managementBase).toBe("https://custom.api/mgmt");
  });

  it("allows stat base URL override", () => {
    process.env.YANDEX_METRIKA_TOKEN = "tok";
    process.env.YANDEX_METRIKA_STAT_BASE = "https://custom.api/stat";
    expect(loadConfig().statBase).toBe("https://custom.api/stat");
  });

  it("uses defaults when env vars not set", () => {
    process.env.YANDEX_METRIKA_TOKEN = "tok";
    const cfg = loadConfig();
    expect(cfg.managementBase).toBe("https://api-metrika.yandex.net/management/v1");
    expect(cfg.statBase).toBe("https://api-metrika.yandex.net/stat/v1");
  });
});
