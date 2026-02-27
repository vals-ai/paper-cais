import { useEffect, useMemo, useState } from 'react'
import { Heart, MessageSquare, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabaseClient'
import type { FeedPost } from '../lib/types'
import { formatRelativeTime, isEdited } from '../lib/dates'
import { cn } from '../lib/cn'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog'
import { Textarea } from './ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import { CommentThread } from './CommentThread'
import { PostContent } from './PostContent'

function initialsFrom(str: string) {
  const parts = str.trim().split(/\s+/g).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function PostCard({
  post,
  onChanged,
  onDeleted,
  defaultCommentsOpen,
}: {
  post: FeedPost
  onChanged?: () => void
  onDeleted?: (postId: string) => void
  defaultCommentsOpen?: boolean
}) {
  const supabase = useMemo(() => getSupabaseClient(), [])
  const navigate = useNavigate()
  const { user } = useAuth()

  const [likedByMe, setLikedByMe] = useState(post.likedByMe)
  const [likesCount, setLikesCount] = useState(post.likesCount)
  const [commentsCount, setCommentsCount] = useState(post.commentsCount)
  const [isCommentsOpen, setIsCommentsOpen] = useState(
    defaultCommentsOpen ?? false,
  )

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editValue, setEditValue] = useState(post.content)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setLikedByMe(post.likedByMe)
    setLikesCount(post.likesCount)
    setCommentsCount(post.commentsCount)

    if (!isEditOpen) {
      setEditValue(post.content)
    }
  }, [
    post.id,
    post.likedByMe,
    post.likesCount,
    post.commentsCount,
    post.content,
    isEditOpen,
  ])


  const authorLabel = post.author?.display_name?.trim() || 'Member'
  const initials = initialsFrom(authorLabel)
  const isMine = user?.id === post.user_id

  async function toggleLike() {
    if (!user) {
      navigate('/login')
      return
    }

    const nextLiked = !likedByMe
    setLikedByMe(nextLiked)
    setLikesCount((c) => Math.max(0, c + (nextLiked ? 1 : -1)))

    try {
      if (nextLiked) {
        const { error } = await supabase
          .from('likes')
          .insert({ post_id: post.id, user_id: user.id })
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
        if (error) throw error
      }
      onChanged?.()
    } catch (e) {
      console.error(e)
      // revert
      setLikedByMe(!nextLiked)
      setLikesCount((c) => Math.max(0, c + (nextLiked ? -1 : 1)))
      toast.error('Could not update like')
    }
  }

  async function saveEdit() {
    if (!user || !isMine) return

    const text = editValue.trim()
    if (!text) {
      toast.error('Post cannot be empty')
      return
    }
    if (text.length > 280) {
      toast.error('Post is too long')
      return
    }

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('posts')
        .update({ content: text })
        .eq('id', post.id)
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('Post updated')
      setIsEditOpen(false)
      onChanged?.()
    } catch (e) {
      console.error(e)
      toast.error('Could not update post')
    } finally {
      setIsSaving(false)
    }
  }

  async function deletePost() {
    if (!user || !isMine) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
        .eq('user_id', user.id)

      if (error) throw error
      toast.success('Post deleted')
      onDeleted?.(post.id)
    } catch (e) {
      console.error(e)
      toast.error('Could not delete post')
    }
  }

  return (
    <Card className="transition-shadow hover:shadow-soft">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link to={`/profile/${post.user_id}`} className="shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.avatar_url ?? undefined} alt={authorLabel} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/profile/${post.user_id}`}
                    className="truncate text-sm font-semibold hover:underline"
                  >
                    {authorLabel}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(post.created_at)}
                    {isEdited(post.created_at, post.updated_at) ? ' · edited' : ''}
                  </span>
                  {post.trendScore > 0 ? (
                    <Badge variant="secondary">Trending</Badge>
                  ) : null}
                </div>
              </div>

              {isMine ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Post menu">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onSelect={() => {
                        setEditValue(post.content)
                        setIsEditOpen(true)
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={deletePost}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>

            <Link to={`/post/${post.id}`} className="block">
              <PostContent content={post.content} className="mt-2" />
            </Link>

            <div className="mt-3 flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={likedByMe ? 'default' : 'secondary'}
                    size="sm"
                    onClick={toggleLike}
                    className={cn(
                      'gap-2',
                      likedByMe ? 'bg-primary/90 hover:bg-primary' : undefined,
                    )}
                  >
                    <Heart
                      className={cn(
                        'h-4 w-4',
                        likedByMe ? 'fill-current' : undefined,
                      )}
                    />
                    {likesCount}
                  </Button>
                </TooltipTrigger>
                {!user ? (
                  <TooltipContent>Sign in to like</TooltipContent>
                ) : (
                  <TooltipContent>{likedByMe ? 'Unlike' : 'Like'}</TooltipContent>
                )}
              </Tooltip>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsCommentsOpen((v) => !v)}
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                {commentsCount}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                Open
              </Button>
            </div>

            {isCommentsOpen ? (
              <div className="mt-4 rounded-md border border-border/60 bg-muted/30 p-4">
                <CommentThread
                  postId={post.id}
                  onCountChange={(count) => setCommentsCount(count)}
                />
              </div>
            ) : null}
          </div>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <span className="hidden" />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit post</DialogTitle>
              <DialogDescription>Update your post (max 280 characters).</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} />
              <div className="text-xs text-muted-foreground">
                {280 - editValue.trim().length} characters remaining
              </div>
            </div>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={isSaving}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
