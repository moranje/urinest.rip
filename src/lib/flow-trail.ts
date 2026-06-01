import { addBreadcrumb } from "./breadcrumbs";
import { scrubValue } from "./scrub";

type FlowTrailType = "flow-start" | "flow-step" | "flow-redirect" | "flow-result";

export interface FlowTrailEvent {
  type: FlowTrailType;
  flowId?: string;
  version?: string;
  stepId?: string;
  questionId?: string;
  branch?: string;
  role?: string;
  targetFlowId?: string;
  resultId?: string;
  ts: string;
}

const MAX_FLOW_TRAIL = 40;
const buffer: FlowTrailEvent[] = [];

function addFlowTrailEvent(event: Omit<FlowTrailEvent, "ts">): void {
  const scrubbed = scrubValue({
    ...event,
    ts: new Date().toISOString(),
  }).value as FlowTrailEvent;

  buffer.push(scrubbed);
  if (buffer.length > MAX_FLOW_TRAIL) {
    buffer.shift();
  }

  addBreadcrumb({
    type: "flow",
    message: scrubbed.type,
    data: {
      flowId: scrubbed.flowId,
      version: scrubbed.version,
      stepId: scrubbed.stepId,
      questionId: scrubbed.questionId,
      branch: scrubbed.branch,
      role: scrubbed.role,
      targetFlowId: scrubbed.targetFlowId,
      resultId: scrubbed.resultId,
    },
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
