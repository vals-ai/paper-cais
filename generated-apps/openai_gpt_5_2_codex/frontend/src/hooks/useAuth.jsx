import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

const emptyProfile = {
  id: null,
  display_name: null,
  bio: null,
  avatar_url: null
}

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState(null)
  const user = session?.user ?? null

  const fetchProfile = async (userId) => {
    if (!userId) {
      setProfile(emptyProfile)
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      setProfile({ ...emptyProfile, id: userId })
      return
    }
    setProfile(data)
  }

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!isMounted) return
        if (error) {
          setAuthError(error.message)
          setSession(null)
        } else {
          setSession(data.session)
          await fetchProfile(data.session?.user?.id)
        }
      } catch (error) {
        if (isMounted) {
          setAuthError(error?.message || 'Unable to load your session.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      setAuthError(null)
      await fetchProfile(newSession?.user?.id)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signUp = async ({ email, password }) => {
    setAuthError(null)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      })
      if (error) {
        setAuthError(error.message)
        return { data: null, error }
      }
      if (data?.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({ id: data.user.id })
        if (profileError) {
          setAuthError(profileError.message)
          return { data: null, error: profileError }
        }
      }
      if (data?.session) {
        setSession(data.session)
        await fetchProfile(data.session.user?.id)
      } else {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session) {
          setSession(sessionData.session)
          await fetchProfile(sessionData.session.user?.id)
        }
      }
      return { data, error: null }
    } catch (error) {
      setAuthError(error?.message || 'Authentication failed.')
      return { data: null, error }
    }
  }

  const signIn = async ({ email, password }) => {
    setAuthError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) {
        setAuthError(error.message)
      }
      if (data?.session) {
        setSession(data.session)
        await fetchProfile(data.session.user?.id)
      } else {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData?.session) {
          setSession(sessionData.session)
          await fetchProfile(sessionData.session.user?.id)
        }
      }
      return { data, error }
    } catch (error) {
      setAuthError(error?.message || 'Authentication failed.')
      return { data: null, error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(emptyProfile)
    setAuthError(null)
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id)
    }
  }

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      authError,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      profileComplete: Boolean(profile?.display_name)
    }),
    [session, user, profile, loading, authError]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
