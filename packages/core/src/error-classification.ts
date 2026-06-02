export type BeslismodelErrorSource = "auth" | "database" | "error" | "http" | "network" | "unknown";

export type BeslismodelErrorKind =
  | "auth"
  | "conflict"
  | "database"
  | "forbidden"
  | "gone"
  | "invalid"
  | "network"
  | "not_found"
  | "rate_limit"
  | "server"
  | "timeout"
  | "unknown"
  | "user_message";

export interface BeslismodelErrorClassification {
  readonly errorClass: string;
  readonly kind: BeslismodelErrorKind;
  readonly source: BeslismodelErrorSource;
  readonly level: "error" | "warning";
  readonly status?: number;
  readonly code?: string;
  readonly retryAfterSeconds?: number;
  readonly message?: string;
}

export interface ClassifyBeslismodelErrorOptions {
  readonly isOffline?: boolean;
  readonly now?: () => number;
}

export function getErrorClass(error: unknown): string {
  if (error instanceof Error) return error.constructor.name || error.name || "Error";
  if (error === null) return "null";
  if (error === undefined) return "undefined";
  return typeof error;
}

export function classifyBeslismodelError(
  error: unknown,
  options: ClassifyBeslismodelErrorOptions = {},
): BeslismodelErrorClassification {
  const errorClass = getErrorClass(error);
  const message = getErrorMessage(error);

  if (options.isOffline || isFailedFetch(error)) {
    return { errorClass, kind: "network", source: "network", level: "warning", message };
  }

  if (isTimeoutLike(error)) {
    return { errorClass, kind: "timeout", source: "network", level: "error", message };
  }

  if (isPostgrestLike(error)) {
    return classifyDatabaseError(error, errorClass, message);
  }

  if (isAuthLike(error)) {
    return classifyAuthError(error, errorClass, message, options.now);
  }

  if (hasStatus(error)) {
    return classifyStatusError(error.status, errorClass, message, {
      now: options.now,
      retryAfterSeconds: retryAfterSeconds(error, options.now),
      source: "http",
    });
  }

  if (error instanceof Error && isDutchMessage(error.message)) {
    return { errorClass, kind: "user_message", source: "error", level: "error", message };
  }

  return {
    errorClass,
    kind: "unknown",
    source: error instanceof Error ? "error" : "unknown",
    level: "error",
    message,
  };
}

function classifyDatabaseError(
  error: PostgrestLike,
  errorClass: string,
  message?: string,
): BeslismodelErrorClassification {
  switch (error.code) {
    case "23505":
      return {
        errorClass,
        kind: "conflict",
        source: "database",
        level: "warning",
        code: error.code,
        message,
      };
    case "23503":
    case "PGRST116":
    case "PGRST301":
      return {
        errorClass,
        kind: "not_found",
        source: "database",
        level: "warning",
        code: error.code,
        message,
      };
    case "23514":
      return {
        errorClass,
        kind: "invalid",
        source: "database",
        level: "warning",
        code: error.code,
        message,
      };
    case "42501":
      return {
        errorClass,
        kind: "forbidden",
        source: "database",
        level: "error",
        code: error.code,
        message,
      };
    case "40001":
    case "40P01":
      return {
        errorClass,
        kind: "conflict",
        source: "database",
        level: "warning",
        code: error.code,
        message,
      };
    default:
      return {
        errorClass,
        kind: "database",
        source: "database",
        level: "error",
        code: error.code,
        message,
      };
  }
}

function classifyStatusError(
  status: number,
  errorClass: string,
  message: string | undefined,
  options: {
    readonly now?: () => number;
    readonly retryAfterSeconds?: number;
    readonly source: "auth" | "http";
  },
): BeslismodelErrorClassification {
  if (status === 401) {
    return { errorClass, kind: "auth", source: options.source, level: "warning", status, message };
  }
  if (status === 403) {
    return {
      errorClass,
      kind: "forbidden",
      source: options.source,
      level: "error",
      status,
      message,
    };
  }
  if (status === 404) {
    return {
      errorClass,
      kind: "not_found",
      source: options.source,
      level: "warning",
      status,
      message,
    };
  }
  if (status === 410) {
    return { errorClass, kind: "gone", source: options.source, level: "warning", status, message };
  }
  if (status === 422) {
    return {
      errorClass,
      kind: "invalid",
      source: options.source,
      level: "warning",
      status,
      message,
    };
  }
  if (status === 429) {
    return {
      errorClass,
      kind: "rate_limit",
      source: options.source,
      level: "warning",
      status,
      retryAfterSeconds: options.retryAfterSeconds,
      message,
    };
  }
  if (status >= 500) {
    return { errorClass, kind: "server", source: options.source, level: "error", status, message };
  }
  return { errorClass, kind: "unknown", source: options.source, level: "error", status, message };
}

function classifyAuthError(
  error: Error & { status?: number },
  errorClass: string,
  message: string | undefined,
  now?: () => number,
): BeslismodelErrorClassification {
  const lower = error.message.toLowerCase();

  if (lower.includes("rate limit") || error.status === 429) {
    return classifyStatusError(error.status ?? 429, errorClass, message, {
      now,
      retryAfterSeconds: retryAfterSeconds(error, now),
      source: "auth",
    });
  }
  if (lower.includes("session") || lower.includes("refresh_token")) {
    return {
      errorClass,
      kind: "auth",
      source: "auth",
      level: "warning",
      status: error.status,
      message,
    };
  }
  if (lower.includes("invalid login credentials") || lower.includes("email not confirmed")) {
    return {
      errorClass,
      kind: "auth",
      source: "auth",
      level: "error",
      status: error.status,
      message,
    };
  }

  return {
    errorClass,
    kind: "auth",
    source: "auth",
    level: "error",
    status: error.status,
    message,
  };
}

function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as Record<string, unknown>).message;
    return typeof message === "string" ? message : undefined;
  }
  return typeof error === "string" ? error : undefined;
}

function hasStatus(error: unknown): error is { status: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof (error as Record<string, unknown>).status === "number"
  );
}

interface PostgrestLike {
  readonly code: string;
  readonly message?: string;
}

function isPostgrestLike(error: unknown): error is PostgrestLike {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as Record<string, unknown>).code === "string" &&
    "message" in error
  );
}

function isAuthLike(error: unknown): error is Error & { status?: number } {
  return (
    error instanceof Error && (error.constructor.name === "AuthError" || error.name === "AuthError")
  );
}

function isTimeoutLike(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" ||
      error.constructor.name === "TimeoutError" ||
      error.message.toLowerCase().includes("timed out"))
  );
}

function isFailedFetch(error: unknown): boolean {
  return error instanceof TypeError && error.message === "Failed to fetch";
}

function retryAfterSeconds(error: unknown, now: (() => number) | undefined): number | undefined {
  const retryAfter = readRetryAfter(error);
  if (typeof retryAfter === "number" && Number.isFinite(retryAfter)) {
    return Math.max(0, Math.round(retryAfter));
  }
  if (typeof retryAfter !== "string") return undefined;

  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return Math.max(0, Math.round(seconds));

  const dateMs = Date.parse(retryAfter);
  if (Number.isFinite(dateMs))
    return Math.max(0, Math.ceil((dateMs - (now?.() ?? Date.now())) / 1000));
  return undefined;
}

function readRetryAfter(error: unknown): string | number | null | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const record = error as Record<string, unknown>;
  if ("retryAfter" in record) {
    const retryAfter = record.retryAfter;
    if (typeof retryAfter === "string" || typeof retryAfter === "number" || retryAfter === null) {
      return retryAfter;
    }
  }
  const headers = record.headers;
  if (headers && typeof (headers as Headers).get === "function") {
    return (headers as Headers).get("Retry-After");
  }
  return undefined;
}

function isDutchMessage(message: string): boolean {
  const dutchPatterns = [
    /^(Niet |Geen |Te veel |Sessie |Ongeldig |Laden |Opslaan |Verwijderen )/,
    /mislukt$/,
    /opnieuw$/,
    /gevonden$/,
    /verlopen$/,
  ];
  return dutchPatterns.some((pattern) => pattern.test(message));
}
