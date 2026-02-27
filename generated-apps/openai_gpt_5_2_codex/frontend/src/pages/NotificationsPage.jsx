import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'

const NotificationsPage = () => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadNotifications = async () => {
    setLoading(true)
    setErrorMessage('')
    const { data, error } = await supabase
      .from('notifications')
      .select(
        'id, type, created_at, read_at, actor_id, post_id, comment_id, actor:actor_id(display_name, avatar_url), post:post_id(content)'
      )
      .order('created_at', { ascending: false })

    if (error) {
      setErrorMessage('Unable to load notifications right now.')
      setNotifications([])
    } else {
      setNotifications(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null)
    loadNotifications()
  }

  const notificationCopy = (item) => {
    const actor = item.actor?.display_name || 'Someone'
    if (item.type === 'like') return `${actor} liked your post.`
    if (item.type === 'comment') return `${actor} commented on your post.`
    if (item.type === 'follow') return `${actor} started following you.`
    return `${actor} sent you a notification.`
  }

  return (
    <div className="app-container py-10">
      <div className="surface-card p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">
              Stay up to date with likes, comments, and new followers.
            </p>
          </div>
          {notifications.length > 0 && (
            <Button variant="muted" onClick={markAllRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mt-6 surface-muted px-4 py-3 text-sm text-warning">
          {errorMessage}
        </div>
      )}

      <div className="mt-6 max-h-[70vh] space-y-4 overflow-y-auto pr-2">
        {loading ? (
          <div className="surface-card p-6">
            <Loader label="Loading notifications" />
          </div>
        ) : notifications.length ? (
          notifications.map((item) => (
            <div
              key={item.id}
              className={`flex items-center gap-4 rounded-2xl border border-border p-4 transition ${
                item.read_at ? 'bg-card' : 'bg-muted'
              }`}
            >
              <Avatar src={item.actor?.avatar_url} name={item.actor?.display_name || 'Member'} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{notificationCopy(item)}</p>
                {item.post?.content && (
                  <p className="mt-1 text-xs text-muted-foreground">"{item.post.content}"</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleString()}
              </span>
            </div>
          ))
        ) : (
          <EmptyState
            title="No notifications yet"
            description="Interact with the community to start receiving updates here."
          />
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
