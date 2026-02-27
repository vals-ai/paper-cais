import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../lib/utils'

export const Notifications = () => {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login')
      return
    }

    if (!user) return

    const loadNotifications = async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('notifications')
          .select(`
            *,
            user_profiles:actor_id (*),
            posts:post_id (id, content, user_id),
            comments:comment_id (id, content)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        setNotifications(data || [])

        // Mark all as read
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('read', false)
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()

    // Set up real-time subscription
    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        loadNotifications()
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [user, authLoading, navigate])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 p-8 animate-pulse">
            <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-6">
          Notifications
        </h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 p-4 animate-pulse">
                <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 p-8 text-center">
            <p className="text-neutral-500">
              No notifications yet. Keep posting!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const actor = notification.user_profiles
              const typeEmoji = {
                like: '❤️',
                comment: '💬',
                follow: '👤',
              }[notification.type]

              const typeText = {
                like: 'liked your post',
                comment: 'commented on your post',
                follow: 'started following you',
              }[notification.type]

              return (
                <div
                  key={notification.id}
                  className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => {
                    if (notification.post_id) {
                      navigate(`/profile/${notification.actor_id}`)
                    } else if (notification.type === 'follow') {
                      navigate(`/profile/${notification.actor_id}`)
                    }
                  }}
                >
                  <div className="flex gap-4">
                    {/* Avatar */}
                    {actor?.avatar_url && (
                      <img
                        src={actor.avatar_url}
                        alt={actor.display_name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                    )}

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{typeEmoji}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/profile/${notification.actor_id}`)
                          }}
                          className="font-bold text-neutral-900 hover:text-primary-600 transition-colors"
                        >
                          {actor?.display_name}
                        </button>
                        <span className="text-neutral-600">
                          {typeText}
                        </span>
                      </div>

                      {/* Post preview */}
                      {notification.posts && (
                        <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
                          {notification.posts.content}
                        </p>
                      )}

                      {/* Comment preview */}
                      {notification.comments && (
                        <p className="text-sm text-neutral-600 mt-2 line-clamp-2">
                          {notification.comments.content}
                        </p>
                      )}

                      {/* Timestamp */}
                      <p className="text-xs text-neutral-500 mt-2">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
