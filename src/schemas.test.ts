import { describe, it, expect } from "vitest";
import * as S from "./schemas.js";

describe("schemas", () => {
  describe("counterId", () => {
    it("accepts valid number", () => {
      expect(S.counterId.parse(123)).toBe(123);
    });

    it("rejects string", () => {
      expect(() => S.counterId.parse("abc")).toThrow();
    });
  });

  describe("metrics", () => {
    it("accepts metric string", () => {
      expect(S.metrics.parse("ym:s:visits,ym:s:users")).toBe("ym:s:visits,ym:s:users");
    });
  });

  describe("offset", () => {
    it("defaults to 1 (1-based per Metrika API)", () => {
      expect(S.offset.parse(undefined)).toBe(1);
    });

    it("accepts 1", () => {
      expect(S.offset.parse(1)).toBe(1);
    });

    it("rejects 0 (must be >= 1)", () => {
      expect(() => S.offset.parse(0)).toThrow();
    });

    it("rejects negative", () => {
      expect(() => S.offset.parse(-1)).toThrow();
    });
  });

  describe("limit", () => {
    it("defaults to 100", () => {
      expect(S.limit.parse(undefined)).toBe(100);
    });

    it("rejects 0", () => {
      expect(() => S.limit.parse(0)).toThrow();
    });

    it("rejects > 10000", () => {
      expect(() => S.limit.parse(10001)).toThrow();
    });

    it("accepts max 10000", () => {
      expect(S.limit.parse(10000)).toBe(10000);
    });
  });

  describe("accuracy", () => {
    it("defaults to full", () => {
      expect(S.accuracy.parse(undefined)).toBe("full");
    });

    it("accepts valid values", () => {
      for (const v of ["low", "medium", "high", "full"]) {
        expect(S.accuracy.parse(v)).toBe(v);
      }
    });

    it("rejects invalid", () => {
      expect(() => S.accuracy.parse("ultra")).toThrow();
    });
  });

  describe("group", () => {
    it("defaults to day", () => {
      expect(S.group.parse(undefined)).toBe("day");
    });

    it("accepts all valid values", () => {
      for (const v of ["all", "auto", "minute", "dekaminute", "hour", "day", "week", "month", "quarter", "year"]) {
        expect(S.group.parse(v)).toBe(v);
      }
    });
  });

  describe("logSource", () => {
    it("accepts visits and hits", () => {
      expect(S.logSource.parse("visits")).toBe("visits");
      expect(S.logSource.parse("hits")).toBe("hits");
    });

    it("rejects invalid", () => {
      expect(() => S.logSource.parse("sessions")).toThrow();
    });
  });

  describe("perm", () => {
    it("accepts view and edit", () => {
      expect(S.perm.parse("view")).toBe("view");
      expect(S.perm.parse("edit")).toBe("edit");
    });
  });

  describe("activeDisabled", () => {
    it("defaults to active", () => {
      expect(S.activeDisabled.parse(undefined)).toBe("active");
    });
  });

  describe("date defaults", () => {
    it("date1 defaults to 7daysAgo", () => {
      expect(S.date1.parse(undefined)).toBe("7daysAgo");
    });

    it("date2 defaults to today", () => {
      expect(S.date2.parse(undefined)).toBe("today");
    });
  });

  describe("optional fields", () => {
    it("dimensions is optional", () => {
      expect(S.dimensions.parse(undefined)).toBeUndefined();
    });

    it("filters is optional", () => {
      expect(S.filters.parse(undefined)).toBeUndefined();
    });

    it("sort is optional", () => {
      expect(S.sort.parse(undefined)).toBeUndefined();
    });

    it("lang is optional", () => {
      expect(S.lang.parse(undefined)).toBeUndefined();
    });
  });
});
