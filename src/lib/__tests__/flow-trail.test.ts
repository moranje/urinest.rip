import { describe, expect, it, beforeEach } from "vitest";
import { clearBreadcrumbs, getBreadcrumbs } from "../breadcrumbs";
import {
  clearFlowTrail,
  getFlowTrail,
  recordFlowResult,
  recordFlowStart,
  recordFlowStep,
} from "../flow-trail";

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
        sequence: 0,
        ts: expect.any(String),
        flowId: expect.stringMatching(/^flow_[a-f0-9]{8}$/),
        version: "1",
        stepId: expect.stringMatching(/^step_[a-f0-9]{8}$/),
        questionId: expect.stringMatching(/^question_[a-f0-9]{8}$/),
        branch: expect.stringMatching(/^branch_[a-f0-9]{8}$/),
        role: "behandelaar",
      }),
    ]);
    expect(JSON.stringify(getFlowTrail())).not.toContain("bacteriurie");
    expect(JSON.stringify(getFlowTrail())).not.toContain("q1-o2");
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
          flowId: expect.stringMatching(/^flow_[a-f0-9]{8}$/),
          resultId: expect.stringMatching(/^result_[a-f0-9]{8}$/),
          role: "triagist",
          sequence: 0,
        }),
      }),
    ]);
    expect(JSON.stringify(getBreadcrumbs())).not.toContain("bacteriurie");
    expect(JSON.stringify(getBreadcrumbs())).not.toContain("uti.local.healthy.0");
  });

  it("keeps a capped trail and returns defensive copies", () => {
    for (let index = 0; index < 42; index += 1) {
      recordFlowStart({
        flowId: `flow-${index}`,
        version: "1",
        role: "behandelaar",
      });
    }

    const trail = getFlowTrail();
    trail[0] = {
      ...trail[0],
      flowId: "mutated",
    };

    expect(trail).toHaveLength(40);
    expect(getFlowTrail()).toHaveLength(40);
    expect(getFlowTrail()[0]).toEqual(
      expect.objectContaining({
        flowId: expect.stringMatching(/^flow_[a-f0-9]{8}$/),
        sequence: 2,
      }),
    );
    expect(JSON.stringify(getFlowTrail())).not.toContain("flow-0");
    expect(JSON.stringify(getFlowTrail())).not.toContain("mutated");
  });
});
