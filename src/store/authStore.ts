/**
 * Minimal auth store for admin dashboard access.
 * Uses Supabase email/password auth. No MFA, no inactivity timeout.
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@supabase/supabase-js'
import { getSupabase } from '../lib/supabase/client'
import { createLogger } from '../lib/logger'

const log = createLogger('auth')

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  async function init(): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) return

    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null

    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
  }

  async function signIn(email: string, password: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Supabase niet geconfigureerd')

    loading.value = true
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      log.info('signed in')
    } finally {
      loading.value = false
    }
  }

  async function signOut(): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) return

    await supabase.auth.signOut()
    user.value = null
    log.info('signed out')
  }

  return { user, loading, isAuthenticated, init, signIn, signOut }
})
