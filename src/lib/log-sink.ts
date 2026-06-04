/**
 * Log sink — persists error entries to Supabase.
 *
 * Batched persistence (flush every 2s or buffer full) with a circuit breaker
 * that distinguishes permanent client errors (auth, schema, RLS) from
 * transient ones (network, 5xx). Permanent errors disable persistence
 * immediately; transient errors back off and eventually trip the breaker.
 *
 * On page unload we fall back to `navigator.sendBeacon`, which survives
 * the unload event and delivers the buffered batch as a best-effort POST.
 */

import { createLogger } from "./logger";
import { getBreadcrumbs } from "./breadcrumbs";
import { appConfig } from "../config/app-config";
import { getErrorContext, parseSourceLocation } from "./error-context";
import { getFlowTrail } from "./flow-trail";
import { scrubValue } from "./scrub";
import { readStorage, removeStorage, writeStorage } from "./storage";
import {
  hashForTelemetry,
  sanitizeRouteForTelemetry,
  sanitizeTelemetryContext,
} from "./telemetry-privacy";

const log = createLogger("log-sink");

export interface PersistErrorInput {
  context: string;
  userMessage: string;
  devDetail?: string;
  errorClass: string;
  stack?: string;
  level: "warn" | "error";
  extraContext?: Record<string, unknown>;
}

export interface PersistTelemetryInput {
  module: string;
  message: string;
  level?: "info" | "warn";
  context?: Record<string, unknown>;
}

const BREAKER_STORAGE_KEY = "log_sink_down";

// Session ID for grouping logs from the same browser session
const SESSION_ID = (() => {
  const key = "log_session_id";
  let id = readStorage("session", key);
  if (!id) {
    id = crypto.randomUUID();
    writeStorage("session", key, id);
  }
  return id;
})();

// -- FNV-1a fingerprint for error grouping --

function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function computeFingerprint(input: PersistErrorInput): string {
  const source = parseSourceLocation(input.stack);
  const key = [
    input.context,
    input.errorClass,
    source?.file ?? "",
    source?.line?.toString() ?? "",
  ].join("|");
  return fnv1a(key);
}

// -- Buffer --

interface BufferedEntry {
  level: "info" | "warn" | "error";
  module: string;
  message: string;
  detail: unknown;
  context: Record<string, unknown>;
  source: string;
  session_id: string;
  url: string;
  fingerprint: string;
  created_at: string;
}

const buffer: BufferedEntry[] = [];
const MAX_BUFFER = 20;
const FLUSH_INTERVAL_MS = 2000;
const MAX_FAILURES = 3;

let flushTimer: ReturnType<typeof setInterval> | null = null;
let consecutiveFailures = 0;
let breakerTripped = false;
let persistenceDisabledReason: string | null = null;

function isLocalRuntimeHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function resolvePersistenceDisabledReason(): string | null {
  const breakerDownAt = getLogSinkDownAt();
  if (breakerDownAt) return `disabled by circuit breaker at ${breakerDownAt}`;

  const explicit = import.meta.env.VITE_ENABLE_LOG_PERSISTENCE as string | undefined;
  if (explicit === "false") return "disabled by VITE_ENABLE_LOG_PERSISTENCE=false";
  if (
    import.meta.env.MODE !== "test" &&
    explicit !== "true" &&
    typeof window !== "undefined" &&
    isLocalRuntimeHost(window.location.hostname)
  ) {
    return "disabled on local preview; set VITE_ENABLE_LOG_PERSISTENCE=true to test Supabase persistence";
  }
  if (import.meta.env.MODE !== "test" && import.meta.env.DEV && explicit !== "true") {
    return "disabled in dev; set VITE_ENABLE_LOG_PERSISTENCE=true to test Supabase persistence";
  }

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return "no supabase client configured";

  return null;
}

function startFlushTimer(): void {
  if (flushTimer || breakerTripped) return;
  flushTimer = setInterval(flushLogs, FLUSH_INTERVAL_MS);
}

function tripBreaker(reason: string): void {
  if (breakerTripped) return;
  breakerTripped = true;
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  buffer.length = 0;
  writeStorage("local", BREAKER_STORAGE_KEY, new Date().toISOString());
  log.warn("log persistence disabled", { reason });
}

export function getLogSinkDownAt(): string | null {
  return readStorage("local", BREAKER_STORAGE_KEY);
}

export function clearLogSinkDownFlag(): void {
  removeStorage("local", BREAKER_STORAGE_KEY);
}

interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  status?: number;
}

// Permanent errors mean retrying won't help: auth failure, missing column,
// RLS denial, schema mismatch. We drop the batch and disable persistence.
function isPermanentError(error: SupabaseError): boolean {
  if (error.status === 401 || error.status === 403) return true;
  const msg = (error.message ?? "").toLowerCase();
  if (
    msg.includes("jwt") ||
    msg.includes("unauthorized") ||
    msg.includes("forbidden") ||
    msg.includes("invalid api key") ||
    msg.includes("does not exist") ||
    msg.includes("violates row-level security")
  ) {
    return true;
  }
  const code = error.code ?? "";
  // PostgrestError codes: 42xxx = syntax/schema, 22xxx = data exception,
  // PGRST* = PostgREST runtime errors — all non-retryable for our case.
  if (code.startsWith("PGRST") || code.startsWith("42") || code === "22000") {
    return true;
  }
  return false;
}

export async function flushLogs(): Promise<void> {
  if (buffer.length === 0 || breakerTripped || persistenceDisabledReason) return;

  const batch = buffer.splice(0, buffer.length);

  try {
    const { getSupabase } = await import("./supabase/client");
    const supabase = getSupabase();
    if (!supabase) {
      tripBreaker("no supabase client configured");
      return;
    }

    const { error } = await supabase.rpc("insert_app_logs", { p_logs: batch });

    if (!error) {
      consecutiveFailures = 0;
      return;
    }

    if (isPermanentError(error)) {
      tripBreaker(`permanent error: ${error.message ?? error.code ?? "unknown"}`);
      return;
    }

    consecutiveFailures++;
    if (consecutiveFailures >= MAX_FAILURES) {
      tripBreaker(`transient failures exceeded threshold (${MAX_FAILURES})`);
      return;
    }

    // Transient: re-queue, but cap buffer to prevent memory growth.
    const room = MAX_BUFFER - buffer.length;
    if (room > 0) buffer.unshift(...batch.slice(0, room));
    log.warn("flush failed, will retry", {
      code: error.code,
      failures: consecutiveFailures,
    });
  } catch (err) {
    consecutiveFailures++;
    if (consecutiveFailures >= MAX_FAILURES) {
      tripBreaker(`network exceptions exceeded threshold (${MAX_FAILURES})`);
      return;
    }
    const room = MAX_BUFFER - buffer.length;
    if (room > 0) buffer.unshift(...batch.slice(0, room));
    log.warn("flush threw", { error: err });
  }
}

// -- sendBeacon fallback on unload --
//
// sendBeacon cannot set custom headers, so we pass the anon key as a query
// parameter (Supabase/PostgREST accepts this). Best-effort only — there is
// no response handling.

function flushViaBeacon(): void {
  if (buffer.length === 0 || breakerTripped || persistenceDisabledReason) return;
  if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return;

  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return;

  const endpoint = `${url}/rest/v1/rpc/insert_app_logs?apikey=${encodeURIComponent(key)}`;
  const blob = new Blob([JSON.stringify({ p_logs: buffer })], { type: "application/json" });
  if (navigator.sendBeacon(endpoint, blob)) {
    buffer.length = 0;
  }
}

export function flushViaBeaconForTests(): void {
  if (import.meta.env.MODE !== "test") return;
  flushViaBeacon();
}

// -- Public API --

export function persistError(input: PersistErrorInput): void {
  if (breakerTripped || persistenceDisabledReason) return;

  const errorContext = getErrorContext();
  const breadcrumbs = scrubValue(getBreadcrumbs()).value;
  const flowTrail = getFlowTrail();
  const fingerprint = computeFingerprint(input);
  const source = parseSourceLocation(input.stack);
  const messageScrub = scrubValue(input.userMessage);
  const detailScrub = scrubValue({
    devDetail: input.devDetail,
    errorClass: input.errorClass,
    stack: input.stack,
    sourceLocation: source,
    breadcrumbs,
  });
  const contextScrub = scrubValue({
    ...(errorContext ? { ...errorContext } : {}),
    ...(flowTrail.length > 0 ? { flow_trail: flowTrail } : {}),
    ...input.extraContext,
  });
  const safeMessage = messageScrub.value;
  const safeDetail = sanitizeTelemetryContext(detailScrub.value);
  const safeContext = sanitizeTelemetryContext(contextScrub.value);
  const scrubHits = messageScrub.stats.hits + detailScrub.stats.hits + contextScrub.stats.hits;

  const entry: BufferedEntry = {
    level: input.level,
    module: input.context,
    message: safeMessage,
    detail: safeDetail,
    context: scrubHits > 0 ? { ...safeContext, scrub_hits_total: scrubHits } : safeContext,
    source: appConfig.telemetrySource,
    session_id: hashForTelemetry(SESSION_ID, "session") ?? "session_redacted",
    url: sanitizeRouteForTelemetry(`${window.location.pathname}${window.location.search}`),
    fingerprint,
    created_at: new Date().toISOString(),
  };

  // Drop oldest entry if buffer is full — newer errors are more relevant
  // for diagnosing the user's current session.
  if (buffer.length >= MAX_BUFFER) buffer.shift();
  buffer.push(entry);

  if (buffer.length >= MAX_BUFFER) {
    flushLogs();
  }
}

export function persistTelemetry(input: PersistTelemetryInput): void {
  if (breakerTripped || persistenceDisabledReason) return;

  const errorContext = getErrorContext();
  const contextScrub = scrubValue({
    ...(errorContext ? { ...errorContext } : {}),
    ...input.context,
  });
  const safeContext = sanitizeTelemetryContext(contextScrub.value);
  const safeMessage = scrubValue(input.message).value;

  if (buffer.length >= MAX_BUFFER) buffer.shift();
  buffer.push({
    level: input.level ?? "info",
    module: input.module,
    message: safeMessage,
    detail: null,
    context: safeContext,
    source: appConfig.telemetrySource,
    session_id: hashForTelemetry(SESSION_ID, "session") ?? "session_redacted",
    url: sanitizeRouteForTelemetry(`${window.location.pathname}${window.location.search}`),
    fingerprint: fnv1a(`${input.module}|${input.message}`),
    created_at: new Date().toISOString(),
  });

  if (buffer.length >= MAX_BUFFER) {
    flushLogs();
  }
}

export function initLogSink(): void {
  // Persistence is driven exclusively by handleError() in lib/errors.ts,
  // which calls persistError() directly with rich context (stack, errorClass).
  // We deliberately do NOT register an addLogSink callback here, because that
  // would double-write every error (once via log.error → sink, once direct).
  persistenceDisabledReason = resolvePersistenceDisabledReason();

  if (typeof window !== "undefined") {
    if (persistenceDisabledReason) {
      log.debug("supabase log persistence disabled", { reason: persistenceDisabledReason });
    } else {
      startFlushTimer();
    }
    // pagehide is more reliable than beforeunload on mobile (esp. iOS Safari)
    window.addEventListener("pagehide", flushViaBeacon);
    window.addEventListener("online", () => {
      flushLogs();
    });
    // visibilitychange catches tab-switch scenarios before pagehide fires
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flushViaBeacon();
    });
  }

  log.debug("log sink initialized");
}

export function resetLogSinkForTests(): void {
  if (import.meta.env.MODE !== "test") return;
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  buffer.length = 0;
  consecutiveFailures = 0;
  breakerTripped = false;
  persistenceDisabledReason = null;
  clearLogSinkDownFlag();
}
