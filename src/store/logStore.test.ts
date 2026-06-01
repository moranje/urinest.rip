import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_SESSION_EXPIRED_EVENT } from "../lib/auth-events";
import { useAuthStore } from "./authStore";
import { useLogStore, type LogEvent, type LogGroup } from "./logStore";

const supabase = vi.hoisted(() => ({
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    refreshSession: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("../lib/supabase/client", () => ({
  getSupabase: () => supabase,
}));

const sampleGroup: LogGroup = {
  fingerprint: "abc",
  level: "error",
  module: "test",
  message: "test",
  count: 1,
  first_seen: "2026-06-01T00:00:00.000Z",
  last_seen: "2026-06-01T00:00:00.000Z",
  status: "open",
  resolved_in_version: null,
  note: null,
};

const sampleEvent: LogEvent = {
  id: 1,
  level: "error",
  module: "test",
  message: "test",
  detail: null,
  context: null,
  session_id: null,
  url: null,
  created_at: "2026-06-01T00:00:00.000Z",
};

describe("admin auth refresh handling", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useRealTimers();
    supabase.rpc.mockReset();
    supabase.from.mockReset();
    supabase.auth.getSession.mockReset();
    supabase.auth.onAuthStateChange.mockReset();
    supabase.auth.refreshSession.mockReset();
    supabase.auth.signOut.mockReset();
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    supabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    supabase.auth.refreshSession.mockResolvedValue({ data: { session: null }, error: null });
    supabase.auth.signOut.mockResolvedValue({ error: null });
  });

  it("expires local auth state and emits a session-expired event", async () => {
    const details: unknown[] = [];
    const listener = (event: Event): void => {
      details.push((event as CustomEvent).detail);
    };
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);

    try {
      const authStore = useAuthStore();
      authStore.user = { id: "admin-user" } as never;

      await authStore.expireSession("test:expired", new Error("refresh failed"));

      expect(authStore.user).toBeNull();
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
      expect(details).toEqual([
        { context: "test:expired", message: "Sessie verlopen. Log opnieuw in." },
      ]);
    } finally {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, listener);
    }
  });

  it("stops log auto-refresh when Supabase refresh fails", async () => {
    vi.useFakeTimers();
    supabase.rpc.mockResolvedValue({ data: null, error: { status: 401, message: "jwt expired" } });
    supabase.auth.refreshSession.mockResolvedValue({
      data: { session: null },
      error: new Error("refresh failed"),
    });

    const authStore = useAuthStore();
    const logStore = useLogStore();
    authStore.user = { id: "admin-user" } as never;
    logStore.groups = [sampleGroup];
    logStore.events = [sampleEvent];
    logStore.selectedFingerprint = "abc";

    logStore.startAutoRefresh();
    await logStore.loadGroups();

    expect(logStore.error).toBe("Sessie verlopen. Log opnieuw in.");
    expect(logStore.groups).toEqual([]);
    expect(logStore.events).toEqual([]);
    expect(logStore.selectedFingerprint).toBeNull();
    expect(authStore.user).toBeNull();
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);

    const rpcCallsAfterExpiry = supabase.rpc.mock.calls.length;
    await vi.advanceTimersByTimeAsync(30_000);

    expect(supabase.rpc).toHaveBeenCalledTimes(rpcCallsAfterExpiry);
    vi.useRealTimers();
  });
});
