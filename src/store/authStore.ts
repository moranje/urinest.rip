/**
 * Minimal auth store for admin dashboard access.
 * Uses Supabase email/password auth. No MFA, no inactivity timeout.
 */

import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { User } from "@supabase/supabase-js";
import { emitAuthSessionExpired } from "../lib/auth-events";
import { createLogger } from "../lib/logger";

const log = createLogger("auth");

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const loading = ref(false);
  const initialized = ref(false);
  let initPromise: Promise<void> | null = null;

  const isAuthenticated = computed(() => user.value !== null);

  async function resolveSupabase() {
    const { getSupabase } = await import("../lib/supabase/client");
    return getSupabase();
  }

  async function init(): Promise<void> {
    if (initPromise) return initPromise;

    initPromise = (async () => {
      const supabase = await resolveSupabase();
      if (!supabase) {
        initialized.value = true;
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        user.value = data.session?.user ?? null;

        supabase.auth.onAuthStateChange((_event, session) => {
          user.value = session?.user ?? null;
        });
      } catch (error) {
        await expireSession("auth:init", error);
      } finally {
        initialized.value = true;
      }
    })();

    return initPromise;
  }

  async function signIn(email: string, password: string): Promise<void> {
    const supabase = await resolveSupabase();
    if (!supabase) throw new Error("Supabase niet geconfigureerd");

    loading.value = true;
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      log.info("signed in");
    } finally {
      loading.value = false;
    }
  }

  async function signOut(): Promise<void> {
    const supabase = await resolveSupabase();
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) log.warn("sign out failed", { error: error.message });
    }
    user.value = null;
    log.info("signed out");
  }

  async function expireSession(context: string, cause?: unknown): Promise<void> {
    const supabase = await resolveSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) log.warn("expired session sign out failed", { context, error: error.message });
      } catch (error) {
        log.warn("expired session sign out failed", {
          context,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    user.value = null;
    log.warn("session expired", {
      context,
      cause: cause instanceof Error ? cause.message : String(cause ?? ""),
    });
    emitAuthSessionExpired({ context, message: "Sessie verlopen. Log opnieuw in." });
  }

  return { user, loading, initialized, isAuthenticated, init, signIn, signOut, expireSession };
});
