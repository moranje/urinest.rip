/**
 * Unified Error Classification & Handling
 *
 * Single entry point for all error handling in the app.
 * Classifies errors, shows the right toast, and logs to sinks.
 */

import { classifyBeslismodelError, getErrorClass } from "@moranje/beslismodel/core";
import { appConfig } from "../config/app-config";
import { toastError, toastWarning } from "./toast";
import { createLogger } from "./logger";
import { persistError } from "./log-sink";
import { scrubValue } from "./scrub";

const log = createLogger("error-handler");
const errorMessages = appConfig.errorMessages;

export function handleError(
  error: unknown,
  context?: string,
  extraContext?: Record<string, unknown>,
): string {
  const fallbackStack = new Error("[handleError fallback]").stack;

  const classified = classifyError(error);
  const safeLogData = scrubValue({
    message: classified.userMessage,
    detail: classified.devDetail,
    error,
    context: extraContext,
  }).value;

  if (classified.notify) {
    if (classified.level === "warning") {
      toastWarning(classified.userMessage);
    } else {
      toastError(classified.userMessage);
    }
  }

  log.error(context ?? "unknown", {
    ...safeLogData,
  });

  const originalStack = error instanceof Error ? error.stack : undefined;

  persistError({
    context: context ?? "unknown",
    userMessage: classified.userMessage,
    devDetail: classified.devDetail,
    errorClass: getErrorClass(error),
    stack: originalStack || fallbackStack,
    level: classified.level === "warning" ? "warn" : "error",
    extraContext,
  });

  return classified.userMessage;
}

// -- Internal types --

interface ClassifiedError {
  userMessage: string;
  devDetail?: string;
  level: "error" | "warning";
  notify: boolean;
}

// -- Classification logic --

export function classifyError(error: unknown): ClassifiedError {
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
  const classified = classifyBeslismodelError(error, { isOffline });

  if (classified.kind === "network") {
    return {
      userMessage: isOffline ? errorMessages.network.offline : errorMessages.network.unreachable,
      level: isOffline ? "warning" : "error",
      notify: true,
    };
  }

  if (classified.kind === "timeout") {
    return {
      userMessage: errorMessages.network.timeout,
      devDetail: classified.message,
      level: "error",
      notify: true,
    };
  }

  if (classified.source === "database" && isPostgrestError(error)) {
    return classifyPostgrestError(error);
  }

  if (classified.source === "http" && typeof classified.status === "number") {
    return classifyHttpStatus(classified.status, classified.retryAfterSeconds ?? null);
  }

  if (classified.source === "auth" && error instanceof Error) {
    return classifyAuthError(error);
  }

  // Generic Error with message
  if (error instanceof Error) {
    if (isDutchMessage(error.message)) {
      return {
        userMessage: error.message,
        level: "error",
        notify: true,
      };
    }
    return {
      userMessage: errorMessages.unknown,
      devDetail: error.message,
      level: "error",
      notify: true,
    };
  }

  // Unknown
  return {
    userMessage: errorMessages.unknown,
    level: "error",
    notify: true,
  };
}

// -- Supabase PostgrestError --

interface PostgrestLike {
  code: string;
  message: string;
  details?: string;
  hint?: string;
}

function isPostgrestError(e: unknown): e is PostgrestLike {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    "message" in e &&
    typeof (e as Record<string, unknown>).code === "string"
  );
}

function classifyPostgrestError(e: PostgrestLike): ClassifiedError {
  switch (e.code) {
    case "23505":
      return {
        userMessage: fieldFromError(e)
          ? formatMessage(errorMessages.database.duplicateField, {
              field: fieldFromError(e) ?? "",
            })
          : errorMessages.database.duplicateFallback,
        devDetail: `PostgrestError ${e.code}`,
        level: "warning",
        notify: true,
      };
    case "23503":
      return { userMessage: errorMessages.database.relationMissing, level: "error", notify: true };
    case "23514":
      return {
        userMessage: errorMessages.database.constraint,
        level: "warning",
        notify: true,
      };
    case "42501":
      return {
        userMessage: errorMessages.database.forbidden,
        level: "error",
        notify: true,
      };
    case "PGRST116":
    case "PGRST301":
      return { userMessage: errorMessages.database.notFound, level: "warning", notify: true };
    case "40001":
      return {
        userMessage: errorMessages.database.conflict,
        level: "warning",
        notify: true,
      };
    case "40P01":
      return {
        userMessage: errorMessages.database.busy,
        level: "warning",
        notify: true,
      };
    default:
      return {
        userMessage: errorMessages.database.generic,
        devDetail: `PostgrestError ${e.code}`,
        level: "error",
        notify: true,
      };
  }
}

function fieldFromError(e: PostgrestLike): string | null {
  const source = `${e.details ?? ""} ${e.message ?? ""}`;
  const match = source.match(/Key \(([^)]+)\)=/i);
  return match?.[1] ?? null;
}

// -- Supabase AuthError --

function classifyAuthError(e: Error & { status?: number }): ClassifiedError {
  const msg = e.message.toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return { userMessage: errorMessages.auth.invalidLogin, level: "error", notify: true };
  }
  if (msg.includes("email not confirmed")) {
    return { userMessage: errorMessages.auth.emailUnconfirmed, level: "warning", notify: true };
  }
  if (msg.includes("rate limit") || e.status === 429) {
    return {
      userMessage: errorMessages.auth.rateLimited,
      level: "warning",
      notify: true,
    };
  }
  if (msg.includes("session") || msg.includes("refresh_token")) {
    return { userMessage: errorMessages.auth.sessionExpired, level: "warning", notify: true };
  }

  return {
    userMessage: errorMessages.auth.generic,
    devDetail: e.message,
    level: "error",
    notify: true,
  };
}

function classifyHttpStatus(status: number, retryAfter: number | null = null): ClassifiedError {
  if (status === 401) {
    return { userMessage: errorMessages.http.sessionExpired, level: "warning", notify: true };
  }
  if (status === 403) {
    return { userMessage: errorMessages.http.forbidden, level: "error", notify: true };
  }
  if (status === 404) {
    return { userMessage: errorMessages.http.notFound, level: "warning", notify: true };
  }
  if (status === 422) {
    return { userMessage: errorMessages.http.invalid, level: "warning", notify: true };
  }
  if (status === 429) {
    return {
      userMessage:
        retryAfter && retryAfter > 0
          ? formatMessage(errorMessages.http.rateLimitedWithRetry, {
              seconds: String(retryAfter),
            })
          : errorMessages.http.rateLimited,
      level: "warning",
      notify: true,
    };
  }
  if (status >= 500) {
    return { userMessage: errorMessages.http.server, level: "error", notify: true };
  }
  return { userMessage: errorMessages.http.unknown, level: "error", notify: true };
}

// -- Timeout --

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

export class HttpStatusError extends Error {
  status: number;
  retryAfter?: string | number | null;
  headers?: Headers;

  constructor(
    status: number,
    message: string,
    retryAfter?: string | number | null,
    headers?: Headers,
  ) {
    super(message);
    this.name = "HttpStatusError";
    this.status = status;
    this.retryAfter = retryAfter;
    this.headers = headers;
  }
}

// -- Helpers --

function isDutchMessage(msg: string): boolean {
  const dutchPatterns = [
    /^(Niet |Geen |Te veel |Sessie |Ongeldig |Laden |Opslaan |Verwijderen )/,
    /mislukt$/,
    /opnieuw$/,
    /gevonden$/,
    /verlopen$/,
  ];
  return dutchPatterns.some((p) => p.test(msg));
}

function formatMessage(message: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (formatted, [key, value]) => formatted.replaceAll(`{${key}}`, value),
    message,
  );
}
