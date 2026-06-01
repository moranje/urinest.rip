import { scrubText } from "./scrub";
import { readStorage, writeStorage } from "./storage";

const SALT_STORAGE_KEY = "telemetry_privacy_salt";

function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function getTelemetrySalt(): string {
  const existing = readStorage("session", SALT_STORAGE_KEY);
  if (existing) return existing;

  const salt =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  writeStorage("session", SALT_STORAGE_KEY, salt);
  return salt;
}

export function hashForTelemetry(
  value: string | number | undefined,
  prefix: string,
): string | undefined {
  if (value == null || value === "") return undefined;
  return `${prefix}_${fnv1a(`${getTelemetrySalt()}:${String(value)}`)}`;
}

export function sanitizeRouteForTelemetry(input: string): string {
  const scrubbed = scrubText(input);
  try {
    const base =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://urinest.local";
    const url = new URL(scrubbed, base);
    const segments = url.pathname.split("/");

    if ((segments[1] === "questionnaire" || segments[1] === "info") && segments[2]) {
      segments[2] = hashForTelemetry(segments[2], segments[1]) ?? "redacted";
    }

    const params = new URLSearchParams();
    for (const [key, value] of url.searchParams) {
      params.set(key, hashForTelemetry(value, `param_${key}`) ?? "redacted");
    }

    const query = params.toString();
    return `${segments.join("/")}${query ? `?${query}` : ""}`;
  } catch {
    return scrubbed.replace(
      /\/(questionnaire|info)\/([^/?#]+)/g,
      (_match, route: string, value: string) =>
        `/${route}/${hashForTelemetry(value, route) ?? "redacted"}`,
    );
  }
}

export interface TelemetryFlowTrailEvent {
  type: string;
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

export function sanitizeFlowTrailEvent<T extends TelemetryFlowTrailEvent>(event: T): T {
  return {
    ...event,
    flowId: hashForTelemetry(event.flowId, "flow"),
    stepId: hashForTelemetry(event.stepId, "step"),
    questionId: hashForTelemetry(event.questionId, "question"),
    branch: hashForTelemetry(event.branch, "branch"),
    targetFlowId: hashForTelemetry(event.targetFlowId, "flow"),
    resultId: hashForTelemetry(event.resultId, "result"),
  };
}
