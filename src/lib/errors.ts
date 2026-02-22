/**
 * Unified Error Classification & Handling
 *
 * Single entry point for all error handling in the app.
 * Classifies errors, shows the right toast, and logs to sinks.
 */

import { toastError, toastWarning } from './toast'
import { createLogger } from './logger'
import { persistError } from './log-sink'

const log = createLogger('error-handler')

export function handleError(error: unknown, context?: string): string {
  const fallbackStack = new Error('[handleError fallback]').stack

  const classified = classifyError(error)

  if (classified.notify) {
    if (classified.level === 'warning') {
      toastWarning(classified.userMessage)
    } else {
      toastError(classified.userMessage)
    }
  }

  log.error(context ?? 'unknown', {
    message: classified.userMessage,
    detail: classified.devDetail,
    error
  })

  const originalStack = error instanceof Error ? error.stack : undefined

  persistError({
    context: context ?? 'unknown',
    userMessage: classified.userMessage,
    devDetail: classified.devDetail,
    errorClass: error instanceof Error ? error.constructor.name : typeof error,
    stack: originalStack || fallbackStack,
    level: classified.level === 'warning' ? 'warn' : 'error'
  })

  return classified.userMessage
}

// -- Internal types --

interface ClassifiedError {
  userMessage: string
  devDetail?: string
  level: 'error' | 'warning'
  notify: boolean
}

// -- Classification logic --

function classifyError(error: unknown): ClassifiedError {
  // Network / offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      userMessage: 'Geen internetverbinding. Controleer je netwerk.',
      level: 'warning',
      notify: true
    }
  }

  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      userMessage: 'Server niet bereikbaar. Probeer het opnieuw.',
      level: 'error',
      notify: true
    }
  }

  // Timeout
  if (error instanceof TimeoutError) {
    return {
      userMessage: 'Server reageert niet. Probeer het opnieuw.',
      devDetail: error.message,
      level: 'error',
      notify: true
    }
  }

  // Supabase PostgrestError
  if (isPostgrestError(error)) {
    return classifyPostgrestError(error)
  }

  // Supabase AuthError
  if (isAuthError(error)) {
    return classifyAuthError(error)
  }

  // Generic Error with message
  if (error instanceof Error) {
    if (isDutchMessage(error.message)) {
      return {
        userMessage: error.message,
        level: 'error',
        notify: true
      }
    }
    return {
      userMessage: 'Er ging iets mis. Probeer het opnieuw.',
      devDetail: error.message,
      level: 'error',
      notify: true
    }
  }

  // Unknown
  return {
    userMessage: 'Er ging iets mis. Probeer het opnieuw.',
    level: 'error',
    notify: true
  }
}

// -- Type guards --

function hasCode(e: unknown): e is { code: string } {
  return typeof e === 'object' && e !== null && 'code' in e && typeof (e as Record<string, unknown>).code === 'string'
}

function hasStatus(e: unknown): e is { status: number } {
  return typeof e === 'object' && e !== null && 'status' in e && typeof (e as Record<string, unknown>).status === 'number'
}

// -- Supabase PostgrestError --

interface PostgrestLike {
  code: string
  message: string
  details?: string
  hint?: string
}

function isPostgrestError(e: unknown): e is PostgrestLike {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    'message' in e &&
    hasCode(e)
  )
}

function classifyPostgrestError(e: PostgrestLike): ClassifiedError {
  switch (e.code) {
    case '23505':
      return { userMessage: 'Dit item bestaat al.', level: 'warning', notify: true }
    case '23503':
      return { userMessage: 'Gerelateerde gegevens niet gevonden.', level: 'error', notify: true }
    case '42501':
      return { userMessage: 'Je hebt geen toegang tot deze gegevens.', level: 'error', notify: true }
    case 'PGRST301':
      return { userMessage: 'Item niet gevonden.', level: 'warning', notify: true }
    case '40001':
      return { userMessage: 'Gelijktijdige wijziging. Probeer het opnieuw.', level: 'warning', notify: true }
    default:
      return {
        userMessage: 'Database fout. Probeer het opnieuw.',
        devDetail: `PostgrestError ${e.code}`,
        level: 'error',
        notify: true
      }
  }
}

// -- Supabase AuthError --

function isAuthError(e: unknown): e is Error & { status?: number } {
  return (
    e instanceof Error &&
    (e.constructor.name === 'AuthError' ||
      ('status' in e && hasStatus(e)))
  )
}

function classifyAuthError(e: Error & { status?: number }): ClassifiedError {
  const msg = e.message.toLowerCase()

  if (msg.includes('invalid login credentials')) {
    return { userMessage: 'Ongeldig e-mailadres of wachtwoord.', level: 'error', notify: true }
  }
  if (msg.includes('email not confirmed')) {
    return { userMessage: 'E-mailadres nog niet bevestigd.', level: 'warning', notify: true }
  }
  if (msg.includes('rate limit') || e.status === 429) {
    return { userMessage: 'Te veel pogingen. Probeer het later opnieuw.', level: 'warning', notify: true }
  }
  if (msg.includes('session') || msg.includes('refresh_token')) {
    return { userMessage: 'Sessie verlopen. Log opnieuw in.', level: 'warning', notify: true }
  }

  return {
    userMessage: 'Authenticatie fout. Probeer het opnieuw.',
    devDetail: e.message,
    level: 'error',
    notify: true
  }
}

// -- Timeout --

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutError(ms)), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) }
    )
  })
}

export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

// -- Helpers --

function isDutchMessage(msg: string): boolean {
  const dutchPatterns = [
    /^(Niet |Geen |Te veel |Sessie |Ongeldig |Laden |Opslaan |Verwijderen )/,
    /mislukt$/,
    /opnieuw$/,
    /gevonden$/,
    /verlopen$/
  ]
  return dutchPatterns.some((p) => p.test(msg))
}
