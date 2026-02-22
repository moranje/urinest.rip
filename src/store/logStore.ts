/**
 * Log store — reactive state for the admin error dashboard.
 *
 * Uses source-filtered RPCs (get_grouped_logs_by_source / get_recent_logs_by_source)
 * to isolate urinest.rip logs from patient-tracker in the shared Supabase instance.
 * Auto-refreshes every 30 seconds when active.
 */

import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getSupabase } from '../lib/supabase/client'

const APP_SOURCE = 'urinestrip'

// -- Types --

export interface LogGroup {
  fingerprint: string
  level: string
  module: string
  message: string
  count: number
  first_seen: string
  last_seen: string
  status: string
  resolved_in_version: string | null
  note: string | null
}

export interface LogEvent {
  id: number
  level: string
  module: string
  message: string
  detail: Record<string, unknown> | null
  context: Record<string, unknown> | null
  session_id: string | null
  url: string | null
  created_at: string
}

export interface LogFilters {
  hours: number
  level: string | null
  status: string
}

export const useLogStore = defineStore('logs', () => {
  const groups = ref<LogGroup[]>([])
  const events = ref<LogEvent[]>([])
  const selectedFingerprint = ref<string | null>(null)
  const filters = ref<LogFilters>({ hours: 24, level: null, status: 'open' })
  const loading = ref(false)
  const loadingEvents = ref(false)
  const error = ref('')
  let refreshTimer: ReturnType<typeof setInterval> | null = null

  async function loadGroups(): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) return

    loading.value = true
    error.value = ''

    try {
      const { data, error: rpcError } = await supabase.rpc('get_grouped_logs_by_source', {
        p_source: APP_SOURCE,
        p_hours: filters.value.hours,
        p_level: filters.value.level,
        p_status: filters.value.status
      })

      if (rpcError) throw rpcError
      groups.value = (data ?? []) as LogGroup[]
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Logs laden mislukt'
      groups.value = []
    } finally {
      loading.value = false
    }
  }

  async function loadEvents(fingerprint: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) return

    selectedFingerprint.value = fingerprint
    loadingEvents.value = true

    try {
      const { data, error: rpcError } = await supabase.rpc('get_recent_logs_by_source', {
        p_source: APP_SOURCE,
        p_fingerprint: fingerprint
      })

      if (rpcError) throw rpcError
      events.value = (data ?? []) as LogEvent[]
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Events laden mislukt'
      events.value = []
    } finally {
      loadingEvents.value = false
    }
  }

  function selectGroup(fingerprint: string | null): void {
    selectedFingerprint.value = fingerprint
    if (!fingerprint) {
      events.value = []
    }
  }

  function setFilters(newFilters: Partial<LogFilters>): void {
    filters.value = { ...filters.value, ...newFilters }
  }

  function startAutoRefresh(): void {
    stopAutoRefresh()
    refreshTimer = setInterval(() => {
      if (!selectedFingerprint.value) {
        loadGroups()
      }
    }, 30_000)
  }

  function stopAutoRefresh(): void {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }

  async function resolveGroup(fingerprint: string, version: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) return

    const { error: err } = await supabase
      .from('log_resolutions')
      .upsert({
        fingerprint,
        status: 'resolved',
        resolved_in_version: version,
        updated_at: new Date().toISOString()
      }, { onConflict: 'fingerprint' })

    if (err) throw err
    await loadGroups()
  }

  async function suppressGroup(fingerprint: string, note?: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) return

    const { error: err } = await supabase
      .from('log_resolutions')
      .upsert({
        fingerprint,
        status: 'suppressed',
        note: note ?? null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'fingerprint' })

    if (err) throw err
    await loadGroups()
  }

  async function unresolveGroup(fingerprint: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) return

    const { error: err } = await supabase
      .from('log_resolutions')
      .delete()
      .eq('fingerprint', fingerprint)

    if (err) throw err
    await loadGroups()
  }

  return {
    groups, events, selectedFingerprint, filters,
    loading, loadingEvents, error,
    loadGroups, loadEvents, selectGroup, setFilters,
    startAutoRefresh, stopAutoRefresh,
    resolveGroup, suppressGroup, unresolveGroup
  }
})
