/**
 * Breadcrumb ring buffer — captures recent user actions for error context.
 *
 * Keeps the last 25 events (navigation, clicks, API calls, log messages).
 * Consecutive identical messages are collapsed with a count.
 */

import { scrubText, scrubValue } from "./scrub";
import { sanitizeRouteForTelemetry } from "./telemetry-privacy";

export interface Breadcrumb {
  type: "navigation" | "click" | "api" | "log" | "flow";
  message: string;
  timestamp: string;
  count?: number;
  data?: Record<string, unknown>;
}

const MAX_BREADCRUMBS = 25;
const buffer: Breadcrumb[] = [];

export function addBreadcrumb(crumb: Omit<Breadcrumb, "timestamp" | "count">): void {
  const messageStats = { hits: 0 };
  const safeMessage = scrubText(crumb.message, messageStats);
  const safeData = crumb.data ? scrubValue(crumb.data) : undefined;
  const scrubHits = messageStats.hits + (safeData?.stats.hits ?? 0);
  const safeCrumb: Omit<Breadcrumb, "timestamp" | "count"> = {
    ...crumb,
    message: safeMessage,
    data: safeData?.value,
  };
  if (scrubHits > 0) {
    safeCrumb.data = { ...safeCrumb.data, scrub_hits_total: scrubHits };
  }

  const last = buffer[buffer.length - 1];
  if (last && last.type === safeCrumb.type && last.message === safeCrumb.message) {
    last.count = (last.count ?? 1) + 1;
    last.timestamp = new Date().toISOString();
    return;
  }

  buffer.push({
    ...safeCrumb,
    timestamp: new Date().toISOString(),
  });
  if (buffer.length > MAX_BREADCRUMBS) {
    buffer.shift();
  }
}

export function getBreadcrumbs(): Breadcrumb[] {
  return buffer.map((b) => ({ ...b }));
}

export function clearBreadcrumbs(): void {
  buffer.length = 0;
}

export function breadcrumbNav(from: string, to: string): void {
  addBreadcrumb({
    type: "navigation",
    message: `${sanitizeRouteForTelemetry(from)} → ${sanitizeRouteForTelemetry(to)}`,
  });
}

export function breadcrumbClick(label: string, data?: Record<string, unknown>): void {
  addBreadcrumb({ type: "click", message: label, data });
}

export function breadcrumbApi(method: string, url: string, duration?: number): void {
  addBreadcrumb({
    type: "api",
    message: `${method} ${sanitizeRouteForTelemetry(url)}`,
    data: duration != null ? { ms: duration } : undefined,
  });
}

export function breadcrumbLog(level: string, module: string, message: string): void {
  if (level === "debug" || level === "info") return;
  addBreadcrumb({ type: "log", message: `[${module}] ${message}`.slice(0, 120) });
}
