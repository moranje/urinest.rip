import { describe, expect, it } from "vitest";
import { applyRuntimeContext, createRuntimeContext, extendRuntimeContext } from "./runtime-context";

describe("runtime context", () => {
  it("creates immutable context values", () => {
    const source = { role: "clinician", locale: "nl-NL" };
    const context = createRuntimeContext(source);
    source.role = "changed";

    expect(context.has("role")).toBe(true);
    expect(context.get<string>("role")).toBe("clinician");
    expect(context.values).toEqual({ role: "clinician", locale: "nl-NL" });
    expect(Object.isFrozen(context.values)).toBe(true);
  });

  it("extends context without mutating the original context", () => {
    const base = createRuntimeContext({ role: "clinician" });
    const next = extendRuntimeContext(base, { locale: "nl-NL" });

    expect(base.values).toEqual({ role: "clinician" });
    expect(next.values).toEqual({ role: "clinician", locale: "nl-NL" });
  });

  it("applies runtime values and aliases to condition input", () => {
    const answers = { q1: "yes", role: "stale" };
    const context = createRuntimeContext({ role: "clinician", locale: "nl-NL" });

    expect(applyRuntimeContext(answers, context, { aliases: { role: "_role" } })).toEqual({
      q1: "yes",
      role: "clinician",
      locale: "nl-NL",
      _role: "clinician",
    });
  });

  it("can apply aliases without exposing raw context keys", () => {
    const context = createRuntimeContext({ role: "clinician" });

    expect(
      applyRuntimeContext({ q1: "yes" }, context, {
        aliases: { role: "_role" },
        includeContextKeys: false,
      }),
    ).toEqual({ q1: "yes", _role: "clinician" });
  });
});
