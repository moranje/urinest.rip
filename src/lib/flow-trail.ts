import {
  appendAuditTrailEvent,
  createAuditTrailEvent,
  nextAuditTrailSequence,
  toAuditBreadcrumbData,
  type AuditTrailEvent,
  type AuditTrailEventInput,
} from "@beslismodel/core";
import { addBreadcrumb } from "./breadcrumbs";
import { scrubValue } from "./scrub";
import { sanitizeFlowTrailEvent } from "./telemetry-privacy";

export type FlowTrailEvent = AuditTrailEvent;

const MAX_FLOW_TRAIL = 40;
const buffer: FlowTrailEvent[] = [];

function addFlowTrailEvent(event: AuditTrailEventInput): void {
  const rawEvent = createAuditTrailEvent(event, {
    sequence: nextAuditTrailSequence(buffer),
    ts: new Date().toISOString(),
  });
  const scrubbed = scrubValue(sanitizeFlowTrailEvent(rawEvent)).value as FlowTrailEvent;
  const nextTrail = appendAuditTrailEvent(buffer, scrubbed, {
    maxLength: MAX_FLOW_TRAIL,
  });

  buffer.splice(0, buffer.length, ...nextTrail);

  addBreadcrumb({
    type: "flow",
    message: scrubbed.type,
    data: toAuditBreadcrumbData(scrubbed),
  });
}

export function recordFlowStart(data: {
  flowId: string;
  version: string;
  role: string;
  questionId?: string;
}): void {
  addFlowTrailEvent({
    type: "flow-start",
    flowId: data.flowId,
    version: data.version,
    role: data.role,
    questionId: data.questionId,
  });
}

export function recordFlowStep(data: {
  flowId: string;
  version: string;
  stepId?: string;
  questionId: string;
  branch?: string;
  role: string;
}): void {
  addFlowTrailEvent({
    type: "flow-step",
    flowId: data.flowId,
    version: data.version,
    stepId: data.stepId,
    questionId: data.questionId,
    branch: data.branch,
    role: data.role,
  });
}

export function recordFlowRedirect(data: {
  flowId: string;
  version: string;
  targetFlowId: string;
  role: string;
}): void {
  addFlowTrailEvent({
    type: "flow-redirect",
    flowId: data.flowId,
    version: data.version,
    targetFlowId: data.targetFlowId,
    role: data.role,
  });
}

export function recordFlowResult(data: {
  flowId: string;
  version: string;
  resultId: string;
  role: string;
}): void {
  addFlowTrailEvent({
    type: "flow-result",
    flowId: data.flowId,
    version: data.version,
    resultId: data.resultId,
    role: data.role,
  });
}

export function getFlowTrail(): FlowTrailEvent[] {
  return buffer.map((event) => ({ ...event }));
}

export function clearFlowTrail(): void {
  buffer.length = 0;
}
