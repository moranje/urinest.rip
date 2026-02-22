/**
 * Breadcrumb ring buffer — captures recent user actions for error context.
 *
 * Keeps the last 25 events (navigation, clicks, API calls, log messages).
 * Consecutive identical messages are collapsed with a count.
 */

export interface Breadcrumb {
  type: 'navigation' | 'click' | 'api' | 'log'
  message: string
  timestamp: string
  count?: number
  data?: Record<string, unknown>
}

const MAX_BREADCRUMBS = 25
const buffer: Breadcrumb[] = []

export function addBreadcrumb(crumb: Omit<Breadcrumb, 'timestamp' | 'count'>): void {
  const last = buffer[buffer.length - 1]
  if (last && last.type === crumb.type && last.message === crumb.message) {
    last.count = (last.count ?? 1) + 1
    last.timestamp = new Date().toISOString()
    return
  }

  buffer.push({
    ...crumb,
    timestamp: new Date().toISOString()
  })
  if (buffer.length > MAX_BREADCRUMBS) {
    buffer.shift()
  }
}

export function getBreadcrumbs(): Breadcrumb[] {
  return buffer.map((b) => ({ ...b }))
}

export function clearBreadcrumbs(): void {
  buffer.length = 0
}

export function breadcrumbNav(from: string, to: string): void {
  addBreadcrumb({ type: 'navigation', message: `${from} → ${to}` })
}

export function breadcrumbClick(label: string): void {
  addBreadcrumb({ type: 'click', message: label })
}

export function breadcrumbApi(method: string, url: string, duration?: number): void {
  addBreadcrumb({
    type: 'api',
    message: `${method} ${url}`,
    data: duration != null ? { ms: duration } : undefined
  })
}

export function breadcrumbLog(level: string, module: string, message: string): void {
  if (level === 'debug' || level === 'info') return
  addBreadcrumb({ type: 'log', message: `[${module}] ${message}`.slice(0, 120) })
}
