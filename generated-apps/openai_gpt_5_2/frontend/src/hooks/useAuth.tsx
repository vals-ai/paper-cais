import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { getSupabaseClient } from '../lib/supabaseClient'
import type { Profile } from '../lib/types'

type AuthContextValue = {
  isReady: boolean
  session: Session | null
  user: User | null
  profile: Profile | null
  isProfileLoading: boolean
  isOnboarded: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function ensureProfileRow(userId: string) {
  const supabase = getSupabaseClient()

  const { data } = await supabase
    .from('profiles')
    .select('user_id, display_name, bio, avatar_url, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (data) return data as Profile

  // Create a minimal profile row if needed.
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({ user_id: userId }, { onConflict: 'user_id' })

  if (upsertError) throw upsertError

  const { data: after, error: afterError } = await supabase
    .from('profiles')
    .select('user_id, display_name, bio, avatar_url, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (afterError) throw afterError
  return (after ?? null) as Profile | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseClient(), [])

  const [isReady, setIsReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isProfileLoading, setIsProfileLoading] = useState(false)

  const loadProfile = useCallback(
    async (uid: string) => {
      setIsProfileLoading(true)
      try {
        const p = await ensureProfileRow(uid)
        setProfile(p)
      } finally {
        setIsProfileLoading(false)
      }
    },
    [setProfile],
  )

  useEffect(() => {
    let isMounted = true

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (!isMounted) return
        if (error) {
          console.error(error)
        }

        const nextSession = data.session
        setSession(nextSession)
        setUser(nextSession?.user ?? null)

        if (nextSession?.user) {
          await loadProfile(nextSession.user.id)
        } else {
          setProfile(null)
        }

        setIsReady(true)
      })
      .catch((e) => {
        console.error(e)
        setIsReady(true)
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)
      setUser(nextSession?.user ?? null)

      if (nextSession?.user) {
        await loadProfile(nextSession.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, loadProfile])

  const isOnboarded = !!profile?.display_name?.trim()

  const refreshProfile = useCallback(async () => {
    if (!user) return
    await loadProfile(user.id)
  }, [user, loadProfile])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [supabase])

  const value: AuthContextValue = {
    isReady,
    session,
    user,
    profile,
    isProfileLoading,
    isOnboarded,
    refreshProfile,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
