import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'
import Avatar from '../components/Avatar'

const notifIcons = {
  like: <Heart size={14} className="text-red-500" fill="currentColor" />,
  comment: <MessageCircle size={14} className="text-primary" />,
  follow: <UserPlus size={14} className="text-green-500" />,
}

const notifMessages = {
  like: (actor) => <><span className="font-semibold text-foreground">{actor}</span> liked your post</>,
  comment: (actor) => <><span className="font-semibold text-foreground">{actor}</span> commented on your post</>,
  follow: (actor) => <><span className="font-semibold text-foreground">{actor}</span> started following you</>,
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { loading, fetchNotifications, markAllRead } = useNotifications(user?.id)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    loadNotifications()
  }, [user])

  const loadNotifications = async () => {
    const data = await fetchNotifications()
    setNotifications(data)
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <Bell size={48} className="mx-auto mb-4 opacity-30 text-muted-foreground" />
      <h2 className="text-xl font-bold text-foreground mb-2">Sign in to view notifications</h2>
      <Link to="/login" className="btn-primary btn mt-2">Sign in</Link>
    </div>
  )

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn-outline btn-sm btn"
          >
            <CheckCheck size={14} className="mr-1.5" />
            Mark all read
          </button>
        )}
      </div>

      <div className="space-y-1">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="card p-4 flex gap-3 animate-pulse">
              <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-24 rounded" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="card p-16 text-center">
            <Bell size={48} className="mx-auto mb-4 opacity-20 text-muted-foreground" />
            <p className="text-foreground font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              When someone likes, comments, or follows you, it'll appear here
            </p>
          </div>
        ) : (
          notifications.map(notif => {
            const actor = notif.actor
            const actorName = actor?.display_name || actor?.username || 'Someone'

            return (
              <div
                key={notif.id}
                className={`card p-4 flex gap-3 transition-colors hover:bg-accent/30 ${
                  !notif.read ? 'border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Link to={`/profile/${actor?.username}`}>
                    <Avatar src={actor?.avatar_url} size="md" />
                  </Link>
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 border border-border">
                    {notifIcons[notif.type]}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">
                    {notifMessages[notif.type](actorName)}
                  </p>

                  {notif.post && (notif.type === 'like' || notif.type === 'comment') && (
                    <Link
                      to={`/profile/${notif.actor?.username}`}
                      className="mt-1 block text-xs text-muted-foreground bg-secondary rounded px-2 py-1 hover:bg-accent transition-colors line-clamp-2"
                    >
                      "{notif.post.content}"
                    </Link>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    {!notif.read && (
                      <span className="ml-2 inline-block w-1.5 h-1.5 bg-primary rounded-full align-middle" />
                    )}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
