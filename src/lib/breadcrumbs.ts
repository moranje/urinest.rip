/**
 * Breadcrumb ring buffer — captures recent user actions for error context.
 *
 * Keeps the last 25 events (navigation, clicks, API calls, log messages).
 * Consecutive identical messages are collapsed with a count.
 */

import {
  appendBreadcrumb,
  cloneBreadcrumbs,
  type Breadcrumb,
  type BreadcrumbInput,
} from "@moranje/beslismodel/core";
import { scrubText, scrubValue } from "./scrub";
import { sanitizeRouteForTelemetry } from "./telemetry-privacy";

const MAX_BREADCRUMBS = 25;
const buffer: Breadcrumb[] = [];

export function addBreadcrumb(crumb: BreadcrumbInput): void {
  const messageStats = { hits: 0 };
  const safeMessage = scrubText(crumb.message, messageStats);
  const safeData = crumb.data ? scrubValue(crumb.data) : undefined;
  const scrubHits = messageStats.hits + (safeData?.stats.hits ?? 0);
  const safeDataValue = safeData?.value as Record<string, unknown> | undefined;
  const data = scrubHits > 0 ? { ...safeDataValue, scrub_hits_total: scrubHits } : safeDataValue;
  const safeCrumb: BreadcrumbInput = {
    ...crumb,
    message: safeMessage,
    data,
  };

  const nextBreadcrumbs = appendBreadcrumb(buffer, safeCrumb, {
    maxLength: MAX_BREADCRUMBS,
  });
  buffer.splice(0, buffer.length, ...nextBreadcrumbs);
}

export function getBreadcrumbs(): Breadcrumb[] {
  return cloneBreadcrumbs(buffer);
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
