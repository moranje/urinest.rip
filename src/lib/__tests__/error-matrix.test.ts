import { beforeEach, describe, expect, it, vi } from "vitest";
import { appConfig } from "../../config/app-config";

const mocks = vi.hoisted(() => ({
  logError: vi.fn(),
  persistError: vi.fn(),
  toastError: vi.fn(),
  toastWarning: vi.fn(),
}));

vi.mock("../logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: mocks.logError,
    fatal: vi.fn(),
    info: vi.fn(),
    trace: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock("../log-sink", () => ({
  persistError: mocks.persistError,
}));

vi.mock("../toast", () => ({
  toastError: mocks.toastError,
  toastWarning: mocks.toastWarning,
}));

import { classifyError, handleError, HttpStatusError, TimeoutError } from "../errors";

class AuthError extends Error {
  status = 400;

  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

const setOnline = (online: boolean): void => {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: online,
  });
};

describe("handleError matrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setOnline(true);
  });

  it.each([
    {
      error: new TimeoutError(10_000),
      errorClass: "TimeoutError",
      expectedDevDetail: "Request timed out after 10000ms",
      level: "error",
      message: appConfig.errorMessages.network.timeout,
      toast: "error",
    },
    {
      error: new TypeError("Failed to fetch"),
      errorClass: "TypeError",
      level: "error",
      message: appConfig.errorMessages.network.unreachable,
      toast: "error",
    },
    {
      error: new HttpStatusError(401, "session expired"),
      errorClass: "HttpStatusError",
      level: "warn",
      message: appConfig.errorMessages.http.sessionExpired,
      toast: "warning",
    },
    {
      error: new HttpStatusError(403, "forbidden"),
      errorClass: "HttpStatusError",
      level: "error",
      message: appConfig.errorMessages.http.forbidden,
      toast: "error",
    },
    {
      error: new HttpStatusError(429, "rate limited", "12"),
      errorClass: "HttpStatusError",
      level: "warn",
      message: appConfig.errorMessages.http.rateLimitedWithRetry.replace("{seconds}", "12"),
      toast: "warning",
    },
    {
      error: new HttpStatusError(503, "service unavailable"),
      errorClass: "HttpStatusError",
      level: "error",
      message: appConfig.errorMessages.http.server,
      toast: "error",
    },
    {
      error: new HttpStatusError(418, "teapot"),
      errorClass: "HttpStatusError",
      level: "error",
      message: appConfig.errorMessages.http.unknown,
      toast: "error",
    },
    {
      error: {
        code: "23505",
        details: "Key (email)=(arts@example.org) already exists.",
        message: "duplicate key value violates unique constraint",
      },
      errorClass: "object",
      expectedDevDetail: "PostgrestError 23505",
      level: "warn",
      message: "email bestaat al.",
      toast: "warning",
    },
    {
      error: { code: "23503", message: "relation missing" },
      errorClass: "object",
      level: "error",
      message: appConfig.errorMessages.database.relationMissing,
      toast: "error",
    },
    {
      error: { code: "23514", message: "constraint violation" },
      errorClass: "object",
      level: "warn",
      message: appConfig.errorMessages.database.constraint,
      toast: "warning",
    },
    {
      error: { code: "42501", message: "forbidden" },
      errorClass: "object",
      level: "error",
      message: appConfig.errorMessages.database.forbidden,
      toast: "error",
    },
    {
      error: { code: "PGRST301", message: "not found" },
      errorClass: "object",
      level: "warn",
      message: appConfig.errorMessages.database.notFound,
      toast: "warning",
    },
    {
      error: { code: "XX000", message: "internal database error" },
      errorClass: "object",
      expectedDevDetail: "PostgrestError XX000",
      level: "error",
      message: appConfig.errorMessages.database.generic,
      toast: "error",
    },
    {
      error: new AuthError("Invalid login credentials"),
      errorClass: "AuthError",
      level: "error",
      message: appConfig.errorMessages.auth.invalidLogin,
      toast: "error",
    },
    {
      error: new AuthError("Email not confirmed"),
      errorClass: "AuthError",
      level: "warn",
      message: appConfig.errorMessages.auth.emailUnconfirmed,
      toast: "warning",
    },
    {
      error: new AuthError("session expired"),
      errorClass: "AuthError",
      level: "warn",
      message: appConfig.errorMessages.auth.sessionExpired,
      toast: "warning",
    },
    {
      error: new AuthError("Auth rate limit exceeded"),
      errorClass: "AuthError",
      level: "warn",
      message: appConfig.errorMessages.auth.rateLimited,
      toast: "warning",
    },
    {
      error: new Error("Niet gevonden"),
      errorClass: "Error",
      level: "error",
      message: "Niet gevonden",
      toast: "error",
    },
  ] as const)(
    "routes $errorClass to user copy, toast and persistence",
    ({ error, errorClass, expectedDevDetail, level, message, toast }) => {
      expect(classifyError(error).userMessage).toBe(message);
      expect(handleError(error, "matrix:test", { questionnaireId: "strip" })).toBe(message);

      expect(mocks.persistError).toHaveBeenCalledWith(
        expect.objectContaining({
          context: "matrix:test",
          devDetail: expectedDevDetail,
          errorClass,
          extraContext: { questionnaireId: "strip" },
          level,
          stack: expect.any(String),
          userMessage: message,
        }),
      );
      expect(mocks.logError).toHaveBeenCalledWith(
        "matrix:test",
        expect.objectContaining({ message }),
      );

      const expectedToast = toast === "warning" ? mocks.toastWarning : mocks.toastError;
      const unexpectedToast = toast === "warning" ? mocks.toastError : mocks.toastWarning;
      expect(expectedToast).toHaveBeenCalledWith(message);
      expect(unexpectedToast).not.toHaveBeenCalled();
    },
  );

  it("maps offline failures to a warning toast and warning persistence level", () => {
    setOnline(false);

    const message = handleError(new Error("browser offline"), "matrix:offline");

    expect(message).toBe(appConfig.errorMessages.network.offline);
    expect(mocks.toastWarning).toHaveBeenCalledWith(appConfig.errorMessages.network.offline);
    expect(mocks.persistError).toHaveBeenCalledWith(
      expect.objectContaining({
        context: "matrix:offline",
        level: "warn",
        stack: expect.any(String),
        userMessage: appConfig.errorMessages.network.offline,
      }),
    );
  });

  it("scrubs PHI before writing diagnostic logger data", () => {
    handleError(new Error("Patient mail arts@example.org op 2026-06-02"), "matrix:scrub", {
      email: "arts@example.org",
    });

    const logged = JSON.stringify(mocks.logError.mock.calls);
    expect(logged).not.toContain("arts@example.org");
    expect(logged).not.toContain("2026-06-02");
    expect(logged).toContain("***SCRUBBED-EMAIL***");
    expect(logged).toContain("***SCRUBBED-DATE***");
  });
});
