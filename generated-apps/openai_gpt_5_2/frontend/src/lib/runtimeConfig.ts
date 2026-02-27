export type ZeeterRuntimeConfig = {
  SUPABASE_PROJECT_URL: string
  SUPABASE_ANON_KEY: string
  APP_PUBLIC_URL?: string
}

declare global {
  interface Window {
    __ZEETER_CONFIG__?: Partial<ZeeterRuntimeConfig>
  }
}

export function getRuntimeConfig(): Partial<ZeeterRuntimeConfig> {
  if (typeof window === 'undefined') return {}
  return window.__ZEETER_CONFIG__ ?? {}
}

export function getRequiredRuntimeConfig(): ZeeterRuntimeConfig {
  const cfg = getRuntimeConfig()

  const url =
    cfg.SUPABASE_PROJECT_URL ||
    (import.meta.env.VITE_SUPABASE_PROJECT_URL as string | undefined) ||
    (import.meta.env.VITE_SUPABASE_URL as string | undefined)

  const anonKey =
    cfg.SUPABASE_ANON_KEY ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)

  if (!url || !anonKey) {
    throw new Error(
      'Missing runtime config. Ensure /config.js is present and provides SUPABASE_PROJECT_URL and SUPABASE_ANON_KEY.',
    )
  }

  return {
    SUPABASE_PROJECT_URL: url,
    SUPABASE_ANON_KEY: anonKey,
    APP_PUBLIC_URL: cfg.APP_PUBLIC_URL,
  }
}
