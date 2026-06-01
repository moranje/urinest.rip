import { describe, expect, it } from "vitest";
import type { RouteLocationNormalized } from "vue-router";
import { shouldUseRouteViewTransition } from "./view-transition-policy";

const route = (path: string, name: RouteLocationNormalized["name"]): RouteLocationNormalized =>
  ({ path, name }) as RouteLocationNormalized;

describe("route view transition policy", () => {
  it("keeps questionnaire redirects out of route-level view transitions", () => {
    expect(
      shouldUseRouteViewTransition(
        route("/questionnaire/dipslide", "Questionnaire"),
        route("/questionnaire/strip", "Questionnaire"),
      ),
    ).toBe(false);
  });

  it("keeps result navigation out of route-level view transitions", () => {
    expect(
      shouldUseRouteViewTransition(
        route("/info/uti.local", "Result"),
        route("/questionnaire/strip", "Questionnaire"),
      ),
    ).toBe(false);
  });

  it("keeps non-clinical route transitions enabled", () => {
    expect(shouldUseRouteViewTransition(route("/over", "About"), route("/", "Landing"))).toBe(true);
  });
});
