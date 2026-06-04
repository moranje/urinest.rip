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

const SENSITIVE_SINGULAR_KEY_RE =
  /(?:^|_)?(?:flow|question|questionnaire|step|result|targetFlow|targetQuestionnaire)?(?:Id|Key)$/u;
const SENSITIVE_PLURAL_KEY_RE =
  /(?:^|_)?(?:flow|question|questionnaire|step|result|available|answered|targetFlow|targetQuestionnaire)?(?:Ids|Keys)$/u;
const SENSITIVE_CONTEXT_KEYS = new Set(["outcome", "redirectChain"]);
const SAFE_CONTEXT_KEYS = new Set([
  "flow_trail",
  "role",
  "scrub_hits_total",
  "version",
  "questionnaireCount",
  "storeId",
]);

function toSnakeCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/gu, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "")
    .toLowerCase();
}

function summarizeSensitiveValue(key: string, value: unknown): Record<string, unknown> {
  const base = toSnakeCase(key)
    .replace(/_(id|ids|key|keys)$/u, "")
    .replace(/^(available|answered)_/u, "$1_");
  const prefix = base || "context";
  const values = Array.isArray(value) ? value : [value];
  const normalizedValues = values.filter((item) => item != null && item !== "");
  if (normalizedValues.length === 0) {
    return { [`${prefix}_redacted`]: true };
  }

  if (Array.isArray(value)) {
    return {
      [`${prefix}_count`]: normalizedValues.length,
      [`${prefix}_hashes`]: normalizedValues.map((item) =>
        hashForTelemetry(JSON.stringify(item), prefix),
      ),
    };
  }

  return {
    [`${prefix}_hash`]: hashForTelemetry(JSON.stringify(value), prefix),
  };
}

function isSensitiveContextKey(key: string): boolean {
  return (
    SENSITIVE_CONTEXT_KEYS.has(key) ||
    SENSITIVE_SINGULAR_KEY_RE.test(key) ||
    SENSITIVE_PLURAL_KEY_RE.test(key)
  );
}

function sanitizeContextValue(value: unknown, depth: number): unknown {
  if (typeof value === "string") {
    const scrubbed = scrubText(value);
    if (/^\/(?:questionnaire|info)\//u.test(scrubbed) || scrubbed.includes("?")) {
      return sanitizeRouteForTelemetry(scrubbed);
    }
    return scrubbed;
  }
  if (value == null || typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  if (depth <= 0) return "[Max depth]";
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeContextValue(item, depth - 1));
  }
  return sanitizeTelemetryContext(value as Record<string, unknown>, depth - 1);
}

export function sanitizeTelemetryContext(
  context: Record<string, unknown>,
  maxDepth = 4,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(context)) {
    if (key === "flow_trail" || SAFE_CONTEXT_KEYS.has(key)) {
      sanitized[key] = sanitizeContextValue(value, maxDepth - 1);
      continue;
    }

    if (isSensitiveContextKey(key)) {
      Object.assign(sanitized, summarizeSensitiveValue(key, value));
      continue;
    }

    sanitized[scrubText(key)] = sanitizeContextValue(value, maxDepth - 1);
  }

  return sanitized;
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
