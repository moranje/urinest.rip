import { describe, expect, it } from "vitest";
import { parseOutcome, toLegacyOutcome } from "./outcome";

describe("parseOutcome", () => {
  it("parses redirect outcomes", () => {
    expect(parseOutcome("redirect:bacteriurie")).toEqual({
      type: "redirect",
      target: "bacteriurie",
      raw: "redirect:bacteriurie",
    });
  });

  it("parses result outcomes", () => {
    expect(parseOutcome("result:uti.local.healthy.0")).toEqual({
      type: "result",
      key: "uti.local.healthy.0",
      raw: "result:uti.local.healthy.0",
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
