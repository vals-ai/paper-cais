import { useEffect, useMemo, useState } from 'react'
import { MessageSquare, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabaseClient'
import type { CommentRecord } from '../lib/types'
import { formatRelativeTime } from '../lib/dates'
import { toOne } from '../lib/toOne'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Skeleton } from './ui/skeleton'

function initialsFrom(str: string) {
  const parts = str.trim().split(/\s+/g).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function CommentThread({
  postId,
  onCountChange,
}: {
  postId: string
  onCountChange?: (count: number) => void
}) {
  const supabase = useMemo(() => getSupabaseClient(), [])
  const { user } = useAuth()

  const [comments, setComments] = useState<CommentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('comments')
        .select(
          'id, post_id, user_id, content, created_at, updated_at, profiles!comments_user_id_fkey(user_id, display_name, avatar_url)',
        )
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (!cancelled) {
        if (error) {
          console.error(error)
          setComments([])
        } else {
          const rows = (data ?? []) as unknown as CommentRecord[]
          const mapped = rows.map((r) => ({ ...r, profiles: toOne(r.profiles) }))
          setComments(mapped)
          onCountChange?.(mapped.length)
        }
        setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [supabase, postId, onCountChange])

  async function addComment() {
    if (!user) {
      toast.error('Sign in to comment')
      return
    }

    const text = draft.trim()
    if (!text) return
    if (text.length > 280) {
      toast.error('Comment is too long')
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: user.id, content: text })
        .select(
          'id, post_id, user_id, content, created_at, updated_at, profiles!comments_user_id_fkey(user_id, display_name, avatar_url)',
        )
        .single()

      if (error) throw error

      const row = data as unknown as CommentRecord
      const next = [...comments, { ...row, profiles: toOne(row.profiles) }]
      setComments(next)
      onCountChange?.(next.length)
      setDraft('')
    } catch (e) {
      console.error(e)
      toast.error('Could not comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function deleteComment(commentId: string) {
    if (!user) return
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id)

      if (error) throw error

      const next = comments.filter((c) => c.id !== commentId)
      setComments(next)
      onCountChange?.(next.length)
      toast.success('Comment deleted')
    } catch (e) {
      console.error(e)
      toast.error('Could not delete comment')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare className="h-4 w-4" /> Loading comments…
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={user ? 'Write a comment…' : 'Sign in to comment'}
          disabled={!user || isSubmitting}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addComment()
            }
          }}
        />
        <Button
          variant="secondary"
          onClick={addComment}
          disabled={!user || isSubmitting || draft.trim().length === 0}
        >
          {isSubmitting ? 'Sending…' : 'Send'}
        </Button>
      </div>

      {comments.length === 0 ? (
        <div className="rounded-md border border-border/60 bg-muted p-4 text-sm text-muted-foreground">
          No comments yet.
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => {
            const author = toOne(c.profiles)
            const label = author?.display_name?.trim() || 'Member'
            const initials = initialsFrom(label)
            const isMine = user?.id === c.user_id

            return (
              <div key={c.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={author?.avatar_url ?? undefined} alt={label} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatRelativeTime(c.created_at)}
                      </div>
                    </div>
                    {isMine ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteComment(c.id)}
                        aria-label="Delete comment"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                    {c.content}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
