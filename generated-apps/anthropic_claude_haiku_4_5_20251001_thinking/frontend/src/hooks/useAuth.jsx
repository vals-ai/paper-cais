import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setUser(user)
          // Fetch user profile
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (error) throw error
          setProfile(data)
        }
      } catch (err) {
        console.error('Auth init error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        // Fetch updated profile
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription?.unsubscribe()
  }, [])

  const signUp = useCallback(async (email, password, displayName) => {
    try {
      setError(null)
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) throw signUpError

      if (user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            email,
            display_name: displayName || email.split('@')[0],
          })

        if (profileError) throw profileError
        
        setUser(user)
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }

      return user
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const signIn = useCallback(async (email, password) => {
    try {
      setError(null)
      const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      if (user) {
        setUser(user)
        const { data } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }

      return user
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      setError(null)
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [])

  const updateProfile = useCallback(async (updates) => {
    try {
      if (!user) throw new Error('Not authenticated')
      
      const { error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error

      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    }
  }, [user])

  return {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }
}
