import { describe, expect, it } from "vitest";
import { parseOutcome, toLegacyOutcome } from "./outcome";

describe("parseOutcome", () => {
  it("parses redirect outcomes", () => {
    expect(parseOutcome("redirect:next-flow")).toEqual({
      type: "redirect",
      target: "next-flow",
      raw: "redirect:next-flow",
    });
  });

  it("parses result outcomes", () => {
    expect(parseOutcome("result:example.outcome.primary")).toEqual({
      type: "result",
      key: "example.outcome.primary",
      raw: "result:example.outcome.primary",
    });
  });

  it("parses empty outcomes as none", () => {
    expect(parseOutcome(null)).toEqual({ type: "none", raw: null });
  });

  it("rejects malformed outcomes", () => {
    expect(() => parseOutcome("redirect:")).toThrow("Malformed outcome");
    expect(() => parseOutcome("unknown:value")).toThrow("Unsupported outcome type");
  });

  it("can serialize back to legacy outcome strings", () => {
    expect(toLegacyOutcome(parseOutcome("result:abc"))).toBe("result:abc");
    expect(toLegacyOutcome(parseOutcome(null))).toBeNull();
  });
});
