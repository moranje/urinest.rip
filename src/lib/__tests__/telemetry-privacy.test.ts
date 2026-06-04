import { beforeEach, describe, expect, it } from "vitest";
import { breadcrumbApi, breadcrumbNav, clearBreadcrumbs, getBreadcrumbs } from "../breadcrumbs";
import {
  hashForTelemetry,
  sanitizeRouteForTelemetry,
  sanitizeTelemetryContext,
} from "../telemetry-privacy";

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

  it("hashes raw clinical context identifiers and keeps flow trail", () => {
    const sanitized = sanitizeTelemetryContext({
      answeredQuestionIds: ["q_bac_risk", "q_bac_tissue"],
      outcome: "result:uti.local.pregnant.0",
      questionnaireId: "bacteriurie",
      redirectChain: ["strip", "bacteriurie"],
      resultKey: "uti.local.pregnant.0",
      role: "behandelaar",
      flow_trail: [{ flowId: "flow_12345678", questionId: "question_12345678" }],
    });
    const serialized = JSON.stringify(sanitized);

    expect(sanitized).toMatchObject({
      answered_question_count: 2,
      role: "behandelaar",
    });
    expect(serialized).toContain("questionnaire_hash");
    expect(serialized).toContain("result_hash");
    expect(serialized).toContain("redirect_chain_hashes");
    expect(serialized).toContain("flow_trail");
    expect(serialized).not.toContain("questionnaireId");
    expect(serialized).not.toContain("answeredQuestionIds");
    expect(serialized).not.toContain("q_bac");
    expect(serialized).not.toContain("uti.local.pregnant.0");
    expect(serialized).not.toContain("bacteriurie");
  });
});
