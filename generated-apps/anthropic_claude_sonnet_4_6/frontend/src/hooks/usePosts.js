import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePosts() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchFeed = useCallback(async (userId, sort = 'newest', search = '') => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (id, username, display_name, avatar_url),
          likes (id, user_id),
          comments (id)
        `)

      if (search) {
        query = query.ilike('content', `%${search}%`)
      }

      if (sort === 'trending') {
        // Get posts with most likes in last 7 days
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('created_at', weekAgo)
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(50)

      if (error) throw error

      // For trending, sort by likes count
      if (sort === 'trending') {
        data.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      }

      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPersonalizedFeed = useCallback(async (userId, sort = 'newest', search = '') => {
    setLoading(true)
    setError(null)
    try {
      // Get users the current user follows
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)

      const followingIds = followData?.map(f => f.following_id) || []
      // Include own posts too
      const relevantUserIds = [...followingIds, userId]

      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (id, username, display_name, avatar_url),
          likes (id, user_id),
          comments (id)
        `)

      if (search) {
        query = query.ilike('content', `%${search}%`)
      } else if (followingIds.length > 0) {
        query = query.in('user_id', relevantUserIds)
      }

      if (sort === 'trending') {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        query = query.gte('created_at', weekAgo)
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(50)
      if (error) throw error

      if (sort === 'trending') {
        data.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0))
      }

      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createPost = useCallback(async (userId, content) => {
    const { data, error } = await supabase
      .from('posts')
      .insert({ user_id: userId, content })
      .select(`
        *,
        profiles!posts_user_id_fkey (id, username, display_name, avatar_url),
        likes (id, user_id),
        comments (id)
      `)
      .single()
    return { data, error }
  }, [])

  const updatePost = useCallback(async (postId, content) => {
    const { data, error } = await supabase
      .from('posts')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', postId)
      .select(`
        *,
        profiles!posts_user_id_fkey (id, username, display_name, avatar_url),
        likes (id, user_id),
        comments (id)
      `)
      .single()
    return { data, error }
  }, [])

  const deletePost = useCallback(async (postId) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
    return { error }
  }, [])

  const fetchUserPosts = useCallback(async (userId) => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey (id, username, display_name, avatar_url),
        likes (id, user_id),
        comments (id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  }, [])

  return { loading, error, fetchFeed, fetchPersonalizedFeed, createPost, updatePost, deletePost, fetchUserPosts }
}
