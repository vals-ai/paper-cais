import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { getSupabaseClient } from '../lib/supabaseClient'
import type { FeedPost, PostRecord } from '../lib/types'
import { computeTrendScore } from '../lib/feed'
import { toOne } from '../lib/toOne'
import { useAuth } from '../hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Skeleton } from '../components/ui/skeleton'
import { PostCard } from '../components/PostCard'

function mapPost(p: PostRecord, likedByMe: boolean): FeedPost {
  const likesCount = Number(p.likes?.[0]?.count ?? 0)
  const commentsCount = Number(p.comments?.[0]?.count ?? 0)

  return {
    id: p.id,
    user_id: p.user_id,
    content: p.content,
    created_at: p.created_at,
    updated_at: p.updated_at,
    author: toOne(p.profiles),
    likesCount,
    commentsCount,
    likedByMe,
    trendScore: computeTrendScore({ likesCount, commentsCount, createdAtIso: p.created_at }),
  }
}

export function PostPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const supabase = useMemo(() => getSupabaseClient(), [])
  const { user } = useAuth()

  const [post, setPost] = useState<FeedPost | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    if (!id) return
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(
          'id, content, created_at, updated_at, user_id, profiles!posts_user_id_fkey(user_id, display_name, bio, avatar_url), likes(count), comments(count)',
        )
        .eq('id', id)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        setPost(null)
        return
      }

      let likedByMe = false
      if (user) {
        const { data: liked, error: likedError } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .eq('post_id', id)
          .maybeSingle()

        if (likedError) throw likedError
        likedByMe = !!liked
      }

      setPost(mapPost(data as PostRecord, likedByMe))
    } catch (e) {
      console.error(e)
      toast.error('Could not load post')
      setPost(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id])

  if (!id) return <Navigate to="/" replace />

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!post) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Post not found</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This post may have been deleted.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <PostCard
        post={post}
        defaultCommentsOpen
        onChanged={load}
        onDeleted={() => navigate('/')}
      />
    </div>
  )
}
