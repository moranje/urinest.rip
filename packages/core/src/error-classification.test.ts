import { describe, expect, it } from "vitest";
import { classifyBeslismodelError, getErrorClass } from "./error-classification";

class TimeoutError extends Error {
  constructor() {
    super("Request timed out after 1000ms");
    this.name = "TimeoutError";
  }
}

class AuthError extends Error {
  status = 400;
}

describe("error classification", () => {
  it("derives stable error classes without leaking messages", () => {
    expect(getErrorClass(new Error("patient-specific detail"))).toBe("Error");
    expect(getErrorClass(null)).toBe("null");
    expect(getErrorClass("raw")).toBe("string");
  });

  it("classifies network and timeout errors", () => {
    expect(classifyBeslismodelError(new TypeError("Failed to fetch")).kind).toBe("network");
    expect(classifyBeslismodelError(new TimeoutError())).toEqual(
      expect.objectContaining({
        errorClass: "TimeoutError",
        kind: "timeout",
        source: "network",
      }),
    );
    expect(classifyBeslismodelError(new Error("x"), { isOffline: true }).kind).toBe("network");
  });

  it.each([
    ["23505", "conflict", "warning"],
    ["23503", "not_found", "warning"],
    ["23514", "invalid", "warning"],
    ["42501", "forbidden", "error"],
    ["PGRST116", "not_found", "warning"],
    ["40001", "conflict", "warning"],
    ["40P01", "conflict", "warning"],
    ["XX000", "database", "error"],
  ] as const)("classifies database code %s", (code, kind, level) => {
    expect(classifyBeslismodelError({ code, message: "database" })).toEqual(
      expect.objectContaining({
        code,
        kind,
        level,
        source: "database",
      }),
    );
  });

  it.each([
    [401, "auth", "warning"],
    [403, "forbidden", "error"],
    [404, "not_found", "warning"],
    [410, "gone", "warning"],
    [422, "invalid", "warning"],
    [429, "rate_limit", "warning"],
    [503, "server", "error"],
  ] as const)("classifies HTTP status %s", (status, kind, level) => {
    expect(classifyBeslismodelError({ status })).toEqual(
      expect.objectContaining({
        kind,
        level,
        source: "http",
        status,
      }),
    );
  });

  it("normalizes Retry-After without direct browser dependencies", () => {
    expect(classifyBeslismodelError({ status: 429, retryAfter: "12" }).retryAfterSeconds).toBe(12);
    expect(
      classifyBeslismodelError(
        {
          status: 429,
          retryAfter: "Tue, 02 Jun 2026 20:00:12 GMT",
        },
        {
          now: () => Date.parse("Tue, 02 Jun 2026 20:00:00 GMT"),
        },
      ).retryAfterSeconds,
    ).toBe(12);
  });

  it("classifies auth errors before generic status handling", () => {
    expect(classifyBeslismodelError(new AuthError("session expired"))).toEqual(
      expect.objectContaining({
        kind: "auth",
        source: "auth",
        status: 400,
      }),
    );
  });
});
