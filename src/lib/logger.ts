/**
 * Zero-dependency structured logger with CSS-styled browser console output.
 *
 * Features:
 * - 6 standard log levels (trace → fatal) + silent
 * - CSS-styled browser console with colored level badges and module tags
 * - Environment-based configuration via VITE_LOG_LEVEL
 * - Module filtering via VITE_LOG_MODULES
 * - Runtime level override via setLogLevel() / window.__setLogLevel
 * - Sink system for log persistence
 */

import { breadcrumbLog } from './breadcrumbs'

// -- Log levels --

const LOG_LEVELS = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
  silent: 6
} as const

type LogLevel = keyof typeof LOG_LEVELS

// -- Configuration --

function resolveLevel(): number {
  const envLevel = import.meta.env?.VITE_LOG_LEVEL as string | undefined

  if (envLevel && envLevel in LOG_LEVELS) {
    return LOG_LEVELS[envLevel as LogLevel]
  }

  return import.meta.env?.DEV ? LOG_LEVELS.debug : LOG_LEVELS.info
}

let currentLevel = resolveLevel()

export function setLogLevel(level: LogLevel): void {
  currentLevel = LOG_LEVELS[level]
}

// Expose on window for console debugging: window.__setLogLevel('trace')
if (typeof window !== 'undefined') {
  Object.defineProperty(window, '__setLogLevel', { value: setLogLevel, writable: true })
}

// -- Module filtering --

function resolveModuleFilter(): { include: Set<string>; exclude: Set<string> } | null {
  const env = import.meta.env?.VITE_LOG_MODULES as string | undefined
  if (!env) return null

  const parts = env.split(',').map((s) => s.trim()).filter(Boolean)
  const exclude = new Set(parts.filter((p) => p.startsWith('-')).map((p) => p.slice(1)))
  const include = new Set(parts.filter((p) => !p.startsWith('-')))

  if (include.size === 0 && exclude.size === 0) return null
  return { include, exclude }
}

const moduleFilter = resolveModuleFilter()

function isModuleEnabled(mod: string): boolean {
  if (!moduleFilter) return true
  if (moduleFilter.exclude.has(mod)) return false
  if (moduleFilter.include.size > 0) return moduleFilter.include.has(mod)
  return true
}

// -- Browser console styling --

interface LevelStyle {
  badge: string
  text: string
  method: 'debug' | 'log' | 'warn' | 'error'
}

const STYLES: Record<string, LevelStyle> = {
  fatal: {
    badge: 'background:#7f1d1d;color:#fff;font-weight:bold;padding:2px 6px;border-radius:3px',
    text: 'color:#991b1b;font-weight:bold',
    method: 'error'
  },
  error: {
    badge: 'background:#dc2626;color:#fff;font-weight:bold;padding:2px 6px;border-radius:3px',
    text: 'color:#b91c1c',
    method: 'error'
  },
  warn: {
    badge: 'background:#d97706;color:#fff;font-weight:bold;padding:2px 6px;border-radius:3px',
    text: 'color:#92400e',
    method: 'warn'
  },
  info: {
    badge: 'background:#2563eb;color:#fff;padding:2px 6px;border-radius:3px',
    text: '',
    method: 'log'
  },
  debug: {
    badge: 'background:#6b7280;color:#fff;padding:2px 6px;border-radius:3px',
    text: 'color:#6b7280',
    method: 'debug'
  },
  trace: {
    badge: 'background:#9ca3af;color:#fff;padding:2px 6px;border-radius:3px;font-size:0.85em',
    text: 'color:#9ca3af;font-size:0.85em',
    method: 'debug'
  }
}

const MODULE_HUES = [210, 160, 30, 330, 270, 120, 0, 60]

function moduleHue(mod: string): number {
  let hash = 0
  for (let i = 0; i < mod.length; i++) {
    hash = ((hash << 5) - hash + mod.charCodeAt(i)) | 0
  }
  return MODULE_HUES[Math.abs(hash) % MODULE_HUES.length]!
}

function formatTime(): string {
  const d = new Date()
  return (
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0') + ':' +
    String(d.getSeconds()).padStart(2, '0') + '.' +
    String(d.getMilliseconds()).padStart(3, '0')
  )
}

function emitBrowser(level: LogLevel, mod: string, message: string, data?: unknown): void {
  const s = STYLES[level]!
  const hue = moduleHue(mod)
  const modStyle = `background:hsl(${hue},50%,93%);color:hsl(${hue},50%,30%);padding:1px 5px;border-radius:3px;font-size:0.85em`
  const label = level.toUpperCase().padEnd(5)
  const ts = formatTime()

  const args: unknown[] = [
    `%c ${label} %c %c${mod}%c ${ts} ${message}`,
    s.badge,
    s.text,
    modStyle,
    s.text
  ]

  if (data !== undefined) args.push(data)
  console[s.method](...args)
}

// -- Sink system --

export interface LogEntry {
  level: LogLevel
  module: string
  message: string
  data?: unknown
  timestamp: string
}

export type LogSink = (entry: LogEntry) => void

const sinks: LogSink[] = []
let persistThreshold: number = LOG_LEVELS.warn

export function addLogSink(sink: LogSink): void {
  sinks.push(sink)
}

export function setPersistThreshold(level: LogLevel): void {
  persistThreshold = LOG_LEVELS[level]
}

// -- Core emit --

function emit(level: LogLevel, mod: string, message: string, data?: unknown): void {
  if (LOG_LEVELS[level] < currentLevel) return
  if (!isModuleEnabled(mod)) return

  emitBrowser(level, mod, message, data)
  breadcrumbLog(level, mod, message)

  if (LOG_LEVELS[level] >= persistThreshold && sinks.length > 0) {
    const entry: LogEntry = {
      level,
      module: mod,
      message,
      data,
      timestamp: new Date().toISOString()
    }
    for (const sink of sinks) {
      try {
        sink(entry)
      } catch {
        // Never let a sink failure break logging
      }
    }
  }
}

// -- Public API --

export interface Logger {
  trace(message: string, data?: unknown): void
  debug(message: string, data?: unknown): void
  info(message: string, data?: unknown): void
  warn(message: string, data?: unknown): void
  error(message: string, data?: unknown): void
  fatal(message: string, data?: unknown): void
}

export function createLogger(mod: string): Logger {
  return {
    trace: (msg, data?) => emit('trace', mod, msg, data),
    debug: (msg, data?) => emit('debug', mod, msg, data),
    info: (msg, data?) => emit('info', mod, msg, data),
    warn: (msg, data?) => emit('warn', mod, msg, data),
    error: (msg, data?) => emit('error', mod, msg, data),
    fatal: (msg, data?) => emit('fatal', mod, msg, data)
  }
}

export const log = createLogger('app')
