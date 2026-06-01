import { describe, expect, it } from "vitest";
import {
  appendAuditTrailEvent,
  clearAuditTrail,
  createAuditTrail,
  createAuditTrailEvent,
  nextAuditTrailSequence,
  toAuditBreadcrumbData,
} from "./audit-trail";

describe("audit trail", () => {
  it("creates deterministic immutable events from caller-provided clock and sequence", () => {
    const event = createAuditTrailEvent(
      {
        type: "flow-step",
        flowId: "example-flow",
        version: "1",
        stepId: "step-1",
        questionId: "q1",
        branch: "yes",
        role: "clinician",
      },
      { sequence: 2, ts: "2026-06-01T00:00:00.000Z" },
    );

    expect(event).toEqual({
      type: "flow-step",
      sequence: 2,
      ts: "2026-06-01T00:00:00.000Z",
      flowId: "example-flow",
      version: "1",
      stepId: "step-1",
      questionId: "q1",
      branch: "yes",
      role: "clinician",
    });
    expect(Object.isFrozen(event)).toBe(true);
  });

  it("creates immutable defensive trail copies", () => {
    const event = createAuditTrailEvent(
      { type: "flow-start", flowId: "example-flow" },
      { sequence: 0, ts: "2026-06-01T00:00:00.000Z" },
    );
    const input = [event];

    const trail = createAuditTrail(input);
    input.length = 0;

    expect(trail).toEqual([event]);
    expect(Object.isFrozen(trail)).toBe(true);
    expect(clearAuditTrail()).toEqual([]);
    expect(Object.isFrozen(clearAuditTrail())).toBe(true);
  });

  it("appends with a deterministic ring-buffer cap", () => {
    const events = [0, 1, 2].map((sequence) =>
      createAuditTrailEvent(
        { type: "flow-start", flowId: `flow-${sequence}` },
        { sequence, ts: "2026-06-01T00:00:00.000Z" },
      ),
    );
    const originalTrail = createAuditTrail(events.slice(0, 2));

    const trail = appendAuditTrailEvent(originalTrail, events[2], { maxLength: 2 });

    expect(trail.map((event) => event.flowId)).toEqual(["flow-1", "flow-2"]);
    expect(originalTrail.map((event) => event.flowId)).toEqual(["flow-0", "flow-1"]);
    expect(Object.isFrozen(trail)).toBe(true);
  });

  it("derives the next sequence from existing events", () => {
    expect(nextAuditTrailSequence([])).toBe(0);
    expect(
      nextAuditTrailSequence([
        createAuditTrailEvent(
          { type: "flow-start", flowId: "example-flow" },
          { sequence: 4, ts: "2026-06-01T00:00:00.000Z" },
        ),
        createAuditTrailEvent(
          { type: "flow-start", flowId: "example-flow" },
          { sequence: 2, ts: "2026-06-01T00:00:00.000Z" },
        ),
      ]),
    ).toBe(5);
  });

  it("maps only allowlisted event fields to breadcrumb data", () => {
    const event = createAuditTrailEvent(
      {
        type: "flow-result",
        flowId: "example-flow",
        resultId: "result-1",
      },
      { sequence: 1, ts: "2026-06-01T00:00:00.000Z" },
    );

    expect(toAuditBreadcrumbData(event)).toEqual({
      flowId: "example-flow",
      version: undefined,
      stepId: undefined,
      questionId: undefined,
      branch: undefined,
      role: undefined,
      targetFlowId: undefined,
      resultId: "result-1",
      sequence: 1,
    });
    expect(JSON.stringify(toAuditBreadcrumbData(event))).not.toContain("2026-06-01");
  });

  it("rejects invalid deterministic controls", () => {
    expect(() =>
      createAuditTrailEvent(
        { type: "flow-start" },
        { sequence: -1, ts: "2026-06-01T00:00:00.000Z" },
      ),
    ).toThrow("Audit trail sequence must be a non-negative integer");
    expect(() => createAuditTrailEvent({ type: "flow-start" }, { sequence: 0, ts: "" })).toThrow(
      "Audit trail ts must not be empty",
    );
    expect(() =>
      appendAuditTrailEvent(
        [],
        createAuditTrailEvent({ type: "flow-start" }, { sequence: 0, ts: "t" }),
        {
          maxLength: 0,
        },
      ),
    ).toThrow("Audit trail maxLength must be a positive integer");
  });
});
