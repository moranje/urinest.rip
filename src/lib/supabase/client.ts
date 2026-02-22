/**
 * Supabase client singleton.
 *
 * Returns null if env vars are not set (graceful degradation —
 * log sink becomes no-op in local dev without Supabase).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null | undefined

export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client

  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !key) {
    client = null
    return null
  }

  client = createClient(url, key)
  return client
}
