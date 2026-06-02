import { beforeEach, describe, expect, it } from "vitest";
import { appConfig } from "../../config/app-config";
import { HttpStatusError, TimeoutError, classifyError } from "../errors";

class AuthError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

const setOnline = (online: boolean): void => {
  Object.defineProperty(window.navigator, "onLine", {
    configurable: true,
    value: online,
  });
};

describe("classifyError", () => {
  beforeEach(() => {
    setOnline(true);
  });

  it("classifies network timeouts", () => {
    expect(classifyError(new TimeoutError(10000))).toEqual(
      expect.objectContaining({
        devDetail: "Request timed out after 10000ms",
        level: "error",
        notify: true,
        userMessage: appConfig.errorMessages.network.timeout,
      }),
    );
  });

  it.each([
    [
      "online fetch failure",
      true,
      new TypeError("Failed to fetch"),
      appConfig.errorMessages.network.unreachable,
      "error",
    ],
    [
      "offline override",
      false,
      new Error("browser offline"),
      appConfig.errorMessages.network.offline,
      "warning",
    ],
  ] as const)("classifies %s", (_name, online, error, message, level) => {
    setOnline(online);

    expect(classifyError(error)).toEqual(
      expect.objectContaining({
        level,
        notify: true,
        userMessage: message,
      }),
    );
  });

  it("uses configured user-facing copy", () => {
    const original = appConfig.errorMessages.network.timeout;
    appConfig.errorMessages.network.timeout = "Aangepaste domeinmelding voor timeouts.";

    try {
      expect(classifyError(new TimeoutError(10000)).userMessage).toBe(
        "Aangepaste domeinmelding voor timeouts.",
      );
    } finally {
      appConfig.errorMessages.network.timeout = original;
    }
  });

  it("classifies unique violations with field context", () => {
    expect(
      classifyError({
        code: "23505",
        message: "duplicate key value violates unique constraint",
        details: "Key (email)=(test@example.org) already exists.",
      }).userMessage,
    ).toBe("email bestaat al.");
  });

  it("uses duplicate fallback when unique violation field cannot be parsed", () => {
    expect(
      classifyError({
        code: "23505",
        message: "duplicate key value violates unique constraint",
      }),
    ).toEqual(
      expect.objectContaining({
        devDetail: "PostgrestError 23505",
        level: "warning",
        notify: true,
        userMessage: appConfig.errorMessages.database.duplicateFallback,
      }),
    );
  });

  it.each([
    ["23503", "Gerelateerde gegevens niet gevonden."],
    ["23514", "Invoer voldoet niet aan de databasevoorwaarden."],
    ["42501", "Je hebt geen toegang tot deze gegevens."],
    ["PGRST116", "Item niet gevonden."],
    ["PGRST301", "Item niet gevonden."],
    ["40001", "Gelijktijdige wijziging. Probeer het opnieuw."],
    ["40P01", "Database is tijdelijk bezet. Probeer het opnieuw."],
  ])("classifies Postgres/PostgREST code %s", (code, message) => {
    expect(classifyError({ code, message: "database error" }).userMessage).toBe(message);
  });

  it("classifies unknown Postgres errors as generic database errors", () => {
    expect(classifyError({ code: "XX000", message: "internal database error" })).toEqual(
      expect.objectContaining({
        devDetail: "PostgrestError XX000",
        level: "error",
        notify: true,
        userMessage: appConfig.errorMessages.database.generic,
      }),
    );
  });

  it.each([
    [401, "Sessie verlopen. Log opnieuw in."],
    [403, "Je hebt geen toegang tot deze gegevens."],
    [404, "Niet gevonden."],
    [422, "Controleer de ingevoerde gegevens."],
    [429, "Te veel pogingen. Probeer het later opnieuw."],
    [503, "Serverfout. Probeer het opnieuw."],
    [418, "Er ging iets mis. Probeer het opnieuw."],
  ])("classifies HTTP status %s", (status, message) => {
    expect(classifyError({ status }).userMessage).toBe(message);
  });

  it("includes Retry-After guidance for 429 responses", () => {
    expect(classifyError(new HttpStatusError(429, "rate limited", "12")).userMessage).toBe(
      appConfig.errorMessages.http.rateLimitedWithRetry.replace("{seconds}", "12"),
    );
  });

  it.each([
    [
      "invalid login credentials",
      new AuthError("Invalid login credentials"),
      appConfig.errorMessages.auth.invalidLogin,
      "error",
    ],
    [
      "email not confirmed",
      new AuthError("Email not confirmed"),
      appConfig.errorMessages.auth.emailUnconfirmed,
      "warning",
    ],
    [
      "rate limit",
      new AuthError("Auth rate limit exceeded", 429),
      appConfig.errorMessages.auth.rateLimited,
      "warning",
    ],
    [
      "generic auth",
      new AuthError("provider unavailable"),
      appConfig.errorMessages.auth.generic,
      "error",
    ],
  ] as const)("classifies auth %s", (_name, error, message, level) => {
    expect(classifyError(error)).toEqual(
      expect.objectContaining({
        level,
        notify: true,
        userMessage: message,
      }),
    );
  });
});
