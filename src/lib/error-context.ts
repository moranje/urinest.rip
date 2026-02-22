/**
 * Client error context — collects browser, OS, app version, and environment info.
 *
 * Initialized once at app startup. Provides context for every persisted log entry.
 */

export interface ErrorContext {
  appVersion: string
  env: 'dev' | 'prod'
  browser: string
  os: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
}

export interface SourceLocation {
  file: string
  line: number
  column: number
}

let context: ErrorContext | null = null

export function parseBrowser(ua: string): string {
  const edgeMatch = ua.match(/Edg(?:e|A|iOS)?\/(\d+)/)
  if (edgeMatch) return `Edge ${edgeMatch[1]!}`

  const firefoxMatch = ua.match(/Firefox\/(\d+)/)
  if (firefoxMatch) return `Firefox ${firefoxMatch[1]!}`

  const chromeMatch = ua.match(/(?:Chrome|CriOS)\/(\d+)/)
  if (chromeMatch) return `Chrome ${chromeMatch[1]!}`

  const safariMatch = ua.match(/Version\/(\d+(?:\.\d+)?).*Safari/)
  if (safariMatch) return `Safari ${safariMatch[1]!}`

  return 'Unknown'
}

export function parseOS(ua: string): string {
  const iosMatch = ua.match(/(?:iPhone|iPad|iPod).*?OS (\d+[_.]\d+)/)
  if (iosMatch) return `iOS ${iosMatch[1]!.replace('_', '.')}`

  const androidMatch = ua.match(/Android (\d+(?:\.\d+)?)/)
  if (androidMatch) return `Android ${androidMatch[1]!}`

  const macMatch = ua.match(/Mac OS X (\d+[_.]\d+(?:[_.]\d+)?)/)
  if (macMatch) return `macOS ${macMatch[1]!.replace(/_/g, '.')}`

  const winMatch = ua.match(/Windows NT (\d+\.\d+)/)
  if (winMatch) {
    const ver = winMatch[1]!
    if (ver === '10.0') return 'Windows 10+'
    if (ver === '6.3') return 'Windows 8.1'
    if (ver === '6.1') return 'Windows 7'
    return `Windows NT ${ver}`
  }

  if (ua.includes('Linux')) return 'Linux'

  return 'Unknown'
}

export function parseDeviceType(ua: string): 'desktop' | 'mobile' | 'tablet' {
  if (/iPad|tablet/i.test(ua)) return 'tablet'
  if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(ua)) return 'mobile'
  return 'desktop'
}

export function parseSourceLocation(stack?: string): SourceLocation | null {
  if (!stack) return null

  const lines = stack.split('\n')

  for (const line of lines) {
    // Skip framework/library lines
    if (/node_modules|vue\/runtime|@vue\//.test(line)) continue

    const v8Match = line.match(/at\s+(?:.*?\s+\()?(.+?):(\d+):(\d+)\)?/)
    if (v8Match) {
      const file = extractFileName(v8Match[1]!)
      if (file) return { file, line: parseInt(v8Match[2]!), column: parseInt(v8Match[3]!) }
    }

    const safariMatch = line.match(/(?:.*@)?(.+?):(\d+):(\d+)/)
    if (safariMatch) {
      const file = extractFileName(safariMatch[1]!)
      if (file) return { file, line: parseInt(safariMatch[2]!), column: parseInt(safariMatch[3]!) }
    }
  }

  return null
}

function extractFileName(path: string): string | null {
  if (/node_modules|vue\/runtime|@vue\/|<anonymous>|^https?:\/\/[^/]+\/?$/.test(path)) {
    return null
  }

  const segments = path.split('/')
  const filename = segments[segments.length - 1]!

  if (!/\.\w+$/.test(filename)) return null

  return filename
}

export function initErrorContext(): void {
  if (context) return

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''

  context = {
    appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
    env: import.meta.env.DEV ? 'dev' : 'prod',
    browser: parseBrowser(ua),
    os: parseOS(ua),
    deviceType: parseDeviceType(ua)
  }
}

export function getErrorContext(): ErrorContext | null {
  return context
}

export function resetErrorContext(): void {
  context = null
}
