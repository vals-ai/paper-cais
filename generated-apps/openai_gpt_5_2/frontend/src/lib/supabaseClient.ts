import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getRequiredRuntimeConfig } from './runtimeConfig'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (client) return client

  const cfg = getRequiredRuntimeConfig()
  client = createClient(cfg.SUPABASE_PROJECT_URL, cfg.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'zeeter-web',
      },
    },
  })

  return client
}
