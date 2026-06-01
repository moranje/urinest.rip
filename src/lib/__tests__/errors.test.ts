import { describe, expect, it } from "vitest";
import { HttpStatusError, TimeoutError, classifyError } from "../errors";

describe("classifyError", () => {
  it("classifies network timeouts", () => {
    expect(classifyError(new TimeoutError(10000)).userMessage).toBe(
      "Server reageert niet. Probeer het opnieuw.",
    );
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

  it.each([
    ["23503", "Gerelateerde gegevens niet gevonden."],
    ["23514", "Invoer voldoet niet aan de databasevoorwaarden."],
    ["42501", "Je hebt geen toegang tot deze gegevens."],
    ["PGRST116", "Item niet gevonden."],
    ["40001", "Gelijktijdige wijziging. Probeer het opnieuw."],
    ["40P01", "Database is tijdelijk bezet. Probeer het opnieuw."],
  ])("classifies Postgres/PostgREST code %s", (code, message) => {
    expect(classifyError({ code, message: "database error" }).userMessage).toBe(message);
  });

  it.each([
    [401, "Sessie verlopen. Log opnieuw in."],
    [403, "Je hebt geen toegang tot deze gegevens."],
    [404, "Niet gevonden."],
    [422, "Controleer de ingevoerde gegevens."],
    [429, "Te veel pogingen. Probeer het later opnieuw."],
    [503, "Serverfout. Probeer het opnieuw."],
  ])("classifies HTTP status %s", (status, message) => {
    expect(classifyError({ status }).userMessage).toBe(message);
  });

  it("includes Retry-After guidance for 429 responses", () => {
    expect(classifyError(new HttpStatusError(429, "rate limited", "12")).userMessage).toBe(
      "Te veel pogingen. Probeer het over 12 seconden opnieuw.",
    );
  });
});
