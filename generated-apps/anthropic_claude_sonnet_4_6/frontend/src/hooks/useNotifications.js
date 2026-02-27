import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useNotifications(userId) {
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  const fetchNotifications = useCallback(async () => {
    if (!userId) return []
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey (id, username, display_name, avatar_url),
          post:posts (id, content)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      const unread = data?.filter(n => !n.read).length || 0
      setUnreadCount(unread)
      return data || []
    } catch (err) {
      console.error('Error fetching notifications:', err)
      return []
    } finally {
      setLoading(false)
    }
  }, [userId])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    setUnreadCount(0)
  }, [userId])

  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false)
    setUnreadCount(count || 0)
  }, [userId])

  return { loading, unreadCount, fetchNotifications, markAllRead, fetchUnreadCount }
}
