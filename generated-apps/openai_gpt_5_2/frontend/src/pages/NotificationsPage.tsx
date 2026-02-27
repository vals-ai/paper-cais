import { useCallback, useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Bell, Heart, MessageSquare, UserPlus } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabaseClient'
import type { NotificationRecord, NotificationType } from '../lib/types'
import { formatRelativeTime } from '../lib/dates'
import { toOne } from '../lib/toOne'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { ScrollArea } from '../components/ui/scroll-area'
import { Skeleton } from '../components/ui/skeleton'

function initialsFrom(str: string) {
  const parts = str.trim().split(/\s+/g).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function iconFor(type: NotificationType) {
  if (type === 'like') return <Heart className="h-4 w-4" />
  if (type === 'comment') return <MessageSquare className="h-4 w-4" />
  return <UserPlus className="h-4 w-4" />
}

function textFor(n: NotificationRecord) {
  const actorProfile = toOne(n.actor)
  const actor = actorProfile?.display_name?.trim() || 'Someone'
  if (n.type === 'like') return `${actor} liked your post`
  if (n.type === 'comment') return `${actor} commented on your post`
  return `${actor} started following you`
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const supabase = useMemo(() => getSupabaseClient(), [])
  const { user } = useAuth()

  const userId = user?.id

  const [items, setItems] = useState<NotificationRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(
          'id, recipient_id, actor_id, type, post_id, comment_id, created_at, read_at, actor:profiles!notifications_actor_id_fkey(user_id, display_name, avatar_url), post:posts(id, content), comment:comments(id, content)',
        )
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const rows = (data ?? []) as unknown as NotificationRecord[]
      const mapped = rows.map((n) => ({ ...n, actor: toOne(n.actor) }))
      setItems(mapped)
    } catch (e) {
      console.error(e)
      toast.error('Could not load notifications')
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [supabase, userId])

  useEffect(() => {
    void load()
  }, [load])

  async function markRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setItems((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)),
      )
    } catch (e) {
      console.error(e)
    }
  }

  async function markAllRead() {
    if (!userId) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', userId)
        .is('read_at', null)

      if (error) throw error

      toast.success('All caught up')
      await load()
    } catch (e) {
      console.error(e)
      toast.error('Could not mark all as read')
    }
  }

  if (!userId) return <Navigate to="/login" replace />

  const unreadCount = items.filter((n) => !n.read_at).length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" /> Notifications
            </CardTitle>
            <div className="mt-1 text-sm text-muted-foreground">
              Likes, comments, and new followers.
            </div>
          </div>
          <Button variant="secondary" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-sm text-muted-foreground">
            {unreadCount === 0 ? 'No unread notifications.' : `${unreadCount} unread`}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border/60 bg-card shadow-soft">
        <ScrollArea className="h-[calc(100vh-310px)]">
          <div className="space-y-2 p-4">
            {isLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : items.length === 0 ? (
              <div className="rounded-md border border-border/60 bg-muted p-6 text-sm text-muted-foreground">
                No notifications yet.
              </div>
            ) : (
              items.map((n) => {
                const actorProfile = toOne(n.actor)
                const actorLabel = actorProfile?.display_name?.trim() || 'Member'
                const initials = initialsFrom(actorLabel)
                const unread = !n.read_at

                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={async () => {
                      await markRead(n.id)
                      if (n.type === 'follow' && n.actor_id) {
                        navigate(`/profile/${n.actor_id}`)
                      } else if (n.post_id) {
                        navigate(`/post/${n.post_id}`)
                      }
                    }}
                    className={
                      'flex w-full items-start gap-3 rounded-lg border border-border/60 bg-background p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
                    }
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={actorProfile?.avatar_url ?? undefined}
                        alt={actorLabel}
                      />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold">{textFor(n)}</div>
                          {unread ? <Badge>New</Badge> : null}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatRelativeTime(n.created_at)}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="text-muted-foreground">{iconFor(n.type)}</span>
                        {n.type === 'comment' && n.comment ? (
                          <span className="truncate">{n.comment.content}</span>
                        ) : n.post ? (
                          <span className="truncate">{n.post.content}</span>
                        ) : (
                          <span className="truncate">Open</span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
