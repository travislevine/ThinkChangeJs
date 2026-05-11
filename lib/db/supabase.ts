import { createClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/db/database.types"

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.invalid"

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key"

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist so PowerSync can reuse a valid Supabase JWT across reloads (see `getPowerSyncSupabaseAccessToken`).
    persistSession: true,
    autoRefreshToken: true,
  },
})

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

/**
 * PowerSync must receive a **Supabase Auth JWT** (e.g. `session.access_token`) that matches
 * your PowerSync "Use Supabase Auth" / JWKS configuration — not the Supabase anon *publishable* key
 * (that key is not a user session token and triggers `PSYNC_S2101`).
 *
 * BikePark uses anonymous sign-in so staff devices get a real JWT without email/password.
 * Enable **Authentication → Providers → Anonymous** in the Supabase dashboard.
 */
export async function getPowerSyncSupabaseAccessToken(): Promise<{
  token: string
  expiresAt?: Date
} | null> {
  if (!isSupabaseConfigured()) {
    return null
  }

  const {
    data: { session: existing },
  } = await supabase.auth.getSession()
  if (existing?.access_token) {
    return {
      token: existing.access_token,
      expiresAt: existing.expires_at != null ? new Date(existing.expires_at * 1000) : undefined,
    }
  }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    console.warn("[BikePark] Supabase anonymous sign-in failed:", error.message)
    return null
  }
  const session = data.session
  if (!session?.access_token) {
    return null
  }
  return {
    token: session.access_token,
    expiresAt: session.expires_at != null ? new Date(session.expires_at * 1000) : undefined,
  }
}
