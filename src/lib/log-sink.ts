/**
 * Log sink — persists error entries to Supabase.
 *
 * Batched persistence (flush every 2s or buffer full) with circuit breaker
 * (stops after 5 consecutive failures). Degrades gracefully without Supabase.
 */

import { createLogger, addLogSink, type LogEntry } from './logger'
import { getBreadcrumbs } from './breadcrumbs'
import { getErrorContext, parseSourceLocation } from './error-context'

const log = createLogger('log-sink')

export interface PersistErrorInput {
  context: string
  userMessage: string
  devDetail?: string
  errorClass: string
  stack?: string
  level: 'warn' | 'error'
}

// Session ID for grouping logs from the same browser session
const SESSION_ID = (() => {
  const key = 'log_session_id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
})()

// -- FNV-1a fingerprint for error grouping --

function fnv1a(str: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function computeFingerprint(input: PersistErrorInput): string {
  const source = parseSourceLocation(input.stack)
  const key = [
    input.context,
    input.errorClass,
    source?.file ?? '',
    source?.line?.toString() ?? ''
  ].join('|')
  return fnv1a(key)
}

// -- Buffer --

interface BufferedEntry {
  level: string
  module: string
  message: string
  detail: unknown
  context: Record<string, unknown>
  source: string
  session_id: string
  url: string
  fingerprint: string
  created_at: string
}

const buffer: BufferedEntry[] = []
const MAX_BUFFER = 20
const FLUSH_INTERVAL_MS = 2000

let flushTimer: ReturnType<typeof setInterval> | null = null
let consecutiveFailures = 0
const MAX_FAILURES = 5

function startFlushTimer(): void {
  if (flushTimer) return
  flushTimer = setInterval(flushLogs, FLUSH_INTERVAL_MS)
}

export async function flushLogs(): Promise<void> {
  if (buffer.length === 0) return
  if (consecutiveFailures >= MAX_FAILURES) return

  const batch = buffer.splice(0, buffer.length)

  try {
    const { getSupabase } = await import('./supabase/client')
    const supabase = getSupabase()
    if (!supabase) return

    const { error } = await supabase.from('app_logs').insert(batch)
    if (error) {
      consecutiveFailures++
      log.warn('flush failed', { error: error.message, failures: consecutiveFailures })
      // Put entries back if flush failed
      buffer.unshift(...batch)
    } else {
      consecutiveFailures = 0
    }
  } catch {
    consecutiveFailures++
  }
}

// -- Public API --

export function persistError(input: PersistErrorInput): void {
  const errorContext = getErrorContext()
  const breadcrumbs = getBreadcrumbs()
  const fingerprint = computeFingerprint(input)
  const source = parseSourceLocation(input.stack)

  const entry: BufferedEntry = {
    level: input.level,
    module: input.context,
    message: input.userMessage,
    detail: {
      devDetail: input.devDetail,
      errorClass: input.errorClass,
      stack: input.stack,
      sourceLocation: source,
      breadcrumbs
    },
    context: errorContext ? { ...errorContext } : {},
    source: 'urinestrip',
    session_id: SESSION_ID,
    url: window.location.pathname,
    fingerprint,
    created_at: new Date().toISOString()
  }

  buffer.push(entry)
  if (buffer.length >= MAX_BUFFER) {
    flushLogs()
  }
}

export function initLogSink(): void {
  addLogSink((entry: LogEntry) => {
    if (entry.level !== 'error' && entry.level !== 'fatal') return
    persistError({
      context: entry.module,
      userMessage: entry.message,
      devDetail: typeof entry.data === 'string' ? entry.data : undefined,
      errorClass: 'LogEntry',
      level: 'error'
    })
  })
  startFlushTimer()
  log.debug('log sink initialized')
}
