/**
 * Log store — reactive state for the admin error dashboard.
 *
 * Uses source-filtered RPCs (get_grouped_logs_by_source / get_recent_logs_by_source)
 * to isolate urinest.rip logs from patient-tracker in the shared Supabase instance.
 * Auto-refreshes every 30 seconds when active.
 */

import { ref } from "vue";
import { defineStore } from "pinia";
import { getSupabase } from "../lib/supabase/client";
import { handleError } from "../lib/errors";
import { clearLogSinkDownFlag, getLogSinkDownAt } from "../lib/log-sink";
import { useAuthStore } from "./authStore";
import { appConfig } from "../config/app-config";

const APP_SOURCE = appConfig.telemetrySource;
type SupabaseClient = NonNullable<ReturnType<typeof getSupabase>>;
type AdminLogMutation = "resolve" | "suppress" | "unresolve";

const adminMutationErrorCopy: Record<AdminLogMutation, string> = {
  resolve: "Markeren als opgelost mislukt",
  suppress: "Onderdrukken van loggroep mislukt",
  unresolve: "Markering opheffen mislukt",
};

interface RpcResult<T> {
  data: T | null;
  error: unknown;
}

interface AuthRetryResult<T> extends RpcResult<T> {
  sessionExpired: boolean;
}

// -- Types --

export interface LogGroup {
  fingerprint: string;
  level: string;
  module: string;
  message: string;
  count: number;
  first_seen: string;
  last_seen: string;
  status: string;
  resolved_in_version: string | null;
  note: string | null;
}

export interface LogEvent {
  id: number;
  level: string;
  module: string;
  message: string;
  detail: Record<string, unknown> | null;
  context: Record<string, unknown> | null;
  session_id: string | null;
  url: string | null;
  created_at: string;
}

export interface LogFilters {
  hours: number;
  level: string | null;
  status: string;
}

function isAuthRefreshable(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const record = error as Record<string, unknown>;
  return record.code === "42501" || record.status === 401;
}

async function withAuthRetry<T>(
  supabase: SupabaseClient,
  operation: () => Promise<RpcResult<T>>,
  onRefreshFailure: (error: unknown) => Promise<void>,
): Promise<AuthRetryResult<T>> {
  const first = await operation();
  if (!first.error || !isAuthRefreshable(first.error)) {
    return { ...first, sessionExpired: false };
  }

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    await onRefreshFailure(refreshError);
    return { data: null, error: null, sessionExpired: true };
  }
  return { ...(await operation()), sessionExpired: false };
}

export const useLogStore = defineStore("logs", () => {
  const groups = ref<LogGroup[]>([]);
  const events = ref<LogEvent[]>([]);
  const selectedFingerprint = ref<string | null>(null);
  const filters = ref<LogFilters>({ hours: 24, level: null, status: "open" });
  const loading = ref(false);
  const loadingEvents = ref(false);
  const error = ref("");
  const sinkDownAt = ref<string | null>(getLogSinkDownAt());
  let refreshTimer: ReturnType<typeof setInterval> | null = null;

  function refreshSinkStatus(): void {
    sinkDownAt.value = getLogSinkDownAt();
  }

  function clearSinkStatus(): void {
    clearLogSinkDownFlag();
    refreshSinkStatus();
  }

  async function loadGroups(): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    loading.value = true;
    error.value = "";

    try {
      const {
        data,
        error: rpcError,
        sessionExpired,
      } = await withAuthRetry(
        supabase,
        async () =>
          await supabase.rpc("get_grouped_logs_by_source", {
            p_source: APP_SOURCE,
            p_hours: filters.value.hours,
            p_level: filters.value.level,
            p_status: filters.value.status,
          }),
        async (refreshError) =>
          await expireAdminSession("logs:load-groups:refresh-session", refreshError),
      );

      if (sessionExpired) return;
      if (rpcError) throw rpcError;
      groups.value = (data ?? []) as LogGroup[];
    } catch (e) {
      handleError(e, "logs:load-groups", { filters: filters.value });
      error.value = e instanceof Error ? e.message : "Logs laden mislukt";
      groups.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function loadEvents(fingerprint: string): Promise<void> {
    const supabase = getSupabase();
    if (!supabase) return;

    selectedFingerprint.value = fingerprint;
    loadingEvents.value = true;

    try {
      const {
        data,
        error: rpcError,
        sessionExpired,
      } = await withAuthRetry(
        supabase,
        async () =>
          await supabase.rpc("get_recent_logs_by_source", {
            p_source: APP_SOURCE,
            p_fingerprint: fingerprint,
          }),
        async (refreshError) =>
          await expireAdminSession("logs:load-events:refresh-session", refreshError),
      );

      if (sessionExpired) return;
      if (rpcError) throw rpcError;
      events.value = (data ?? []) as LogEvent[];
    } catch (e) {
      handleError(e, "logs:load-events", { fingerprint });
      error.value = e instanceof Error ? e.message : "Events laden mislukt";
      events.value = [];
    } finally {
      loadingEvents.value = false;
    }
  }

  function selectGroup(fingerprint: string | null): void {
    selectedFingerprint.value = fingerprint;
    if (!fingerprint) {
      events.value = [];
    }
  }

  function setFilters(newFilters: Partial<LogFilters>): void {
    filters.value = { ...filters.value, ...newFilters };
  }

  function startAutoRefresh(): void {
    stopAutoRefresh();
    refreshTimer = setInterval(() => {
      if (!selectedFingerprint.value) {
        loadGroups();
      }
    }, 30_000);
  }

  function stopAutoRefresh(): void {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  async function expireAdminSession(context: string, cause: unknown): Promise<void> {
    stopAutoRefresh();
    groups.value = [];
    events.value = [];
    selectedFingerprint.value = null;
    error.value = "Sessie verlopen. Log opnieuw in.";
    await useAuthStore().expireSession(context, cause);
  }

  async function runResolutionMutation(
    action: AdminLogMutation,
    fingerprint: string,
    operation: (supabase: SupabaseClient) => Promise<RpcResult<unknown>>,
  ): Promise<void> {
    const supabase = getSupabase();
    const actionError = adminMutationErrorCopy[action];

    if (!supabase) {
      const configError = new Error("Logbeheer is niet verbonden met Supabase.");
      error.value = `${actionError}. ${configError.message}`;
      handleError(configError, `logs:${action}-group`, { fingerprint });
      throw configError;
    }

    try {
      const { error: mutationError, sessionExpired } = await withAuthRetry(
        supabase,
        async () => await operation(supabase),
        async (refreshError) =>
          await expireAdminSession(`logs:${action}-group:refresh-session`, refreshError),
      );

      if (sessionExpired) {
        throw new Error("Sessie verlopen. Log opnieuw in.");
      }
      if (mutationError) throw mutationError;

      error.value = "";
      await loadGroups();
    } catch (mutationError) {
      const userMessage = handleError(mutationError, `logs:${action}-group`, { fingerprint });
      error.value = `${actionError}. ${userMessage}`;
      throw mutationError;
    }
  }

  async function resolveGroup(fingerprint: string, version: string): Promise<void> {
    await runResolutionMutation(
      "resolve",
      fingerprint,
      async (supabase) =>
        await supabase.from("log_resolutions").upsert(
          {
            fingerprint,
            status: "resolved",
            resolved_in_version: version,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "fingerprint" },
        ),
    );
  }

  async function suppressGroup(fingerprint: string, note?: string): Promise<void> {
    await runResolutionMutation(
      "suppress",
      fingerprint,
      async (supabase) =>
        await supabase.from("log_resolutions").upsert(
          {
            fingerprint,
            status: "suppressed",
            note: note ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "fingerprint" },
        ),
    );
  }

  async function unresolveGroup(fingerprint: string): Promise<void> {
    await runResolutionMutation(
      "unresolve",
      fingerprint,
      async (supabase) =>
        await supabase.from("log_resolutions").delete().eq("fingerprint", fingerprint),
    );
  }

  return {
    groups,
    events,
    selectedFingerprint,
    filters,
    loading,
    loadingEvents,
    error,
    loadGroups,
    loadEvents,
    selectGroup,
    setFilters,
    sinkDownAt,
    refreshSinkStatus,
    clearSinkStatus,
    startAutoRefresh,
    stopAutoRefresh,
    resolveGroup,
    suppressGroup,
    unresolveGroup,
  };
});
