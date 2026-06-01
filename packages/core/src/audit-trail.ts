import type { ManifestId } from "./manifest";

export type AuditTrailEventType = "flow-start" | "flow-step" | "flow-redirect" | "flow-result";

export interface AuditTrailEvent {
  readonly type: AuditTrailEventType;
  readonly sequence: number;
  readonly ts: string;
  readonly flowId?: ManifestId;
  readonly version?: string;
  readonly stepId?: ManifestId;
  readonly questionId?: ManifestId;
  readonly branch?: string;
  readonly role?: string;
  readonly targetFlowId?: ManifestId;
  readonly resultId?: ManifestId;
}

export type AuditTrail = readonly AuditTrailEvent[];

export type AuditTrailEventInput = Omit<AuditTrailEvent, "sequence" | "ts">;

export interface CreateAuditTrailEventOptions {
  readonly sequence: number;
  readonly ts: string;
}

export interface AppendAuditTrailEventOptions {
  readonly maxLength?: number;
}

export function createAuditTrail(events: readonly AuditTrailEvent[] = []): AuditTrail {
  return Object.freeze([...events]);
}

export function clearAuditTrail(): AuditTrail {
  return createAuditTrail();
}

export function createAuditTrailEvent(
  input: AuditTrailEventInput,
  options: CreateAuditTrailEventOptions,
): AuditTrailEvent {
  if (!Number.isInteger(options.sequence) || options.sequence < 0) {
    throw new Error(`Audit trail sequence must be a non-negative integer: ${options.sequence}`);
  }
  if (!options.ts) {
    throw new Error("Audit trail ts must not be empty");
  }

  return Object.freeze({
    ...input,
    sequence: options.sequence,
    ts: options.ts,
  });
}

export function appendAuditTrailEvent(
  trail: AuditTrail,
  event: AuditTrailEvent,
  options: AppendAuditTrailEventOptions = {},
): AuditTrail {
  const maxLength = options.maxLength ?? 40;
  if (!Number.isInteger(maxLength) || maxLength < 1) {
    throw new Error(`Audit trail maxLength must be a positive integer: ${maxLength}`);
  }

  return createAuditTrail([...trail, event].slice(-maxLength));
}

export function nextAuditTrailSequence(trail: AuditTrail): number {
  return trail.length === 0 ? 0 : Math.max(...trail.map((event) => event.sequence)) + 1;
}

export function toAuditBreadcrumbData(event: AuditTrailEvent): Readonly<Record<string, unknown>> {
  return Object.freeze({
    flowId: event.flowId,
    version: event.version,
    stepId: event.stepId,
    questionId: event.questionId,
    branch: event.branch,
    role: event.role,
    targetFlowId: event.targetFlowId,
    resultId: event.resultId,
    sequence: event.sequence,
  });
}
