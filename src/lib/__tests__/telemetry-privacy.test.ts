import { beforeEach, describe, expect, it } from "vitest";
import { breadcrumbApi, breadcrumbNav, clearBreadcrumbs, getBreadcrumbs } from "../breadcrumbs";
import { hashForTelemetry, sanitizeRouteForTelemetry } from "../telemetry-privacy";

describe("telemetry privacy", () => {
  beforeEach(() => {
    clearBreadcrumbs();
    window.sessionStorage.clear();
    window.sessionStorage.setItem("telemetry_privacy_salt", "test-salt");
  });

  it("uses salted stable hashes for telemetry identifiers", () => {
    expect(hashForTelemetry("strip", "flow")).toBe(hashForTelemetry("strip", "flow"));
    expect(hashForTelemetry("strip", "flow")).toMatch(/^flow_[a-f0-9]{8}$/);
    expect(hashForTelemetry("strip", "flow")).not.toContain("strip");
  });

  it("redacts clinical route params and query values", () => {
    const sanitized = sanitizeRouteForTelemetry(
      "/questionnaire/strip?retry=/info/uti.local.healthy.0",
    );

    expect(sanitized).toMatch(/^\/questionnaire\/questionnaire_[a-f0-9]{8}/);
    expect(sanitized).toContain("retry=param_retry_");
    expect(sanitized).not.toContain("strip");
    expect(sanitized).not.toContain("uti.local.healthy.0");
  });

  it("sanitizes navigation and API breadcrumbs", () => {
    breadcrumbNav("/questionnaire/strip", "/info/uti.local.healthy.0");
    breadcrumbApi("GET", "/main.json?apikey=secret", 12);

    const serialized = JSON.stringify(getBreadcrumbs());
    expect(serialized).not.toContain("strip");
    expect(serialized).not.toContain("uti.local.healthy.0");
    expect(serialized).not.toContain("secret");
    expect(serialized).toContain("/questionnaire/questionnaire_");
    expect(serialized).toContain("/info/info_");
  });
});
