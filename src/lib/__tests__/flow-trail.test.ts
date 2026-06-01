import { describe, expect, it, beforeEach } from "vitest";
import { clearBreadcrumbs, getBreadcrumbs } from "../breadcrumbs";
import { clearFlowTrail, getFlowTrail, recordFlowResult, recordFlowStep } from "../flow-trail";

describe("flow trail", () => {
  beforeEach(() => {
    clearFlowTrail();
    clearBreadcrumbs();
  });

  it("stores only whitelisted flow-step metadata", () => {
    recordFlowStep({
      flowId: "bacteriurie",
      version: "1",
      stepId: "risk",
      questionId: "q1",
      branch: "q1-o2",
      role: "behandelaar",
    });

    expect(getFlowTrail()).toEqual([
      expect.objectContaining({
        type: "flow-step",
        flowId: "bacteriurie",
        version: "1",
        stepId: "risk",
        questionId: "q1",
        branch: "q1-o2",
        role: "behandelaar",
      }),
    ]);
    expect(JSON.stringify(getFlowTrail())).not.toContain("Positief");
  });

  it("mirrors flow events into breadcrumb context", () => {
    recordFlowResult({
      flowId: "bacteriurie",
      version: "1",
      resultId: "uti.local.healthy.0",
      role: "triagist",
    });

    expect(getBreadcrumbs()).toEqual([
      expect.objectContaining({
        type: "flow",
        message: "flow-result",
        data: expect.objectContaining({
          flowId: "bacteriurie",
          resultId: "uti.local.healthy.0",
          role: "triagist",
        }),
      }),
    ]);
  });
});
