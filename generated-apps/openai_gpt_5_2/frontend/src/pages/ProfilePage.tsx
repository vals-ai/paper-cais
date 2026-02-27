import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { MessageSquareText } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabaseClient'
import type { FeedPost, PostRecord, Profile } from '../lib/types'
import { computeTrendScore } from '../lib/feed'
import { toOne } from '../lib/toOne'
import { formatRelativeTime } from '../lib/dates'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { ScrollArea } from '../components/ui/scroll-area'
import { Skeleton } from '../components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { FollowButton } from '../components/FollowButton'
import { PostCard } from '../components/PostCard'

function initialsFrom(str: string) {
  const parts = str.trim().split(/\s+/g).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

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

type CommentActivity = {
  id: string
  content: string
  created_at: string
  post: { id: string; content: string } | null
}

export function ProfilePage() {
  const { id } = useParams()
  const supabase = useMemo(() => getSupabaseClient(), [])
  const { user } = useAuth()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [comments, setComments] = useState<CommentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  const [refreshKey, setRefreshKey] = useState(0)


  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!id) return
      setIsLoading(true)

      try {
        const viewerId = user?.id ?? null

        const profilePromise = supabase
          .from('profiles')
          .select('user_id, display_name, bio, avatar_url, created_at, updated_at')
          .eq('user_id', id)
          .maybeSingle()

        const postsPromise = supabase
          .from('posts')
          .select(
            'id, content, created_at, updated_at, user_id, profiles!posts_user_id_fkey(user_id, display_name, bio, avatar_url), likes(count), comments(count)',
          )
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(50)

        const commentsPromise = supabase
          .from('comments')
          .select('id, content, created_at, posts:posts(id, content)')
          .eq('user_id', id)
          .order('created_at', { ascending: false })
          .limit(12)

        const followPromise = viewerId
          ? supabase
              .from('follows')
              .select('followee_id')
              .eq('follower_id', viewerId)
              .eq('followee_id', id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null })

        const [profileRes, postsRes, commentsRes, followRes] = await Promise.all([
          profilePromise,
          postsPromise,
          commentsPromise,
          followPromise,
        ])

        if (profileRes.error) throw profileRes.error
        if (postsRes.error) throw postsRes.error
        if (commentsRes.error) throw commentsRes.error
        if (followRes.error) throw followRes.error

        const postRecords = (postsRes.data ?? []) as PostRecord[]

        let likedSet = new Set<string>()
        if (viewerId && postRecords.length) {
          const { data: liked, error: likedError } = await supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', viewerId)
            .in(
              'post_id',
              postRecords.map((p) => p.id),
            )

          if (likedError) throw likedError
          likedSet = new Set((liked ?? []).map((l) => l.post_id))
        }

        if (cancelled) return

        setProfile((profileRes.data ?? null) as Profile | null)
        setPosts(postRecords.map((p) => mapPost(p, likedSet.has(p.id))))

        const commentRows =
          (commentsRes.data ?? []) as unknown as Array<{
            id: string
            content: string
            created_at: string
            posts:
              | { id: string; content: string }
              | { id: string; content: string }[]
              | null
          }>

        setComments(
          commentRows.map((c) => ({
            id: c.id,
            content: c.content,
            created_at: c.created_at,
            post: Array.isArray(c.posts) ? (c.posts[0] ?? null) : c.posts ?? null,
          })),
        )
        setIsFollowing(!!followRes.data)
      } catch (e) {
        console.error(e)
        toast.error('Could not load profile')
        if (!cancelled) {
          setProfile(null)
          setPosts([])
          setComments([])
          setIsFollowing(false)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [supabase, id, user?.id, refreshKey])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile not found</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          This member profile may not exist.
        </CardContent>
      </Card>
    )
  }

  const label = profile.display_name?.trim() || 'Member'
  const initials = initialsFrom(label)

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={profile.avatar_url ?? undefined} alt={label} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-lg font-semibold tracking-tight">{label}</div>
                <div className="mt-1 max-w-prose text-sm text-muted-foreground">
                  {profile.bio || '—'}
                </div>
              </div>
            </div>

            <FollowButton
              targetUserId={profile.user_id}
              initialFollowing={isFollowing}
              onChange={(next) => setIsFollowing(next)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border/60 bg-card shadow-soft">
        <div className="border-b border-border/60 p-4">
          <Tabs defaultValue="posts">
            <TabsList>
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="posts">
              <ScrollArea className="h-[calc(100vh-420px)]">
                <div className="space-y-4 p-4">
                  {posts.length === 0 ? (
                    <div className="rounded-md border border-border/60 bg-muted p-6 text-sm text-muted-foreground">
                      No posts yet.
                    </div>
                  ) : (
                    posts.map((p) => (
                      <PostCard
                        key={p.id}
                        post={p}
                        onChanged={() => setRefreshKey((k) => k + 1)}
                        onDeleted={() => setRefreshKey((k) => k + 1)}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="comments">
              <ScrollArea className="h-[calc(100vh-420px)]">
                <div className="space-y-3 p-4">
                  {comments.length === 0 ? (
                    <div className="rounded-md border border-border/60 bg-muted p-6 text-sm text-muted-foreground">
                      No recent comments.
                    </div>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-lg border border-border/60 bg-background p-4 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MessageSquareText className="h-4 w-4" />
                            {formatRelativeTime(c.created_at)}
                          </div>
                          {c.post ? (
                            <Link
                              to={`/post/${c.post.id}`}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              View post
                            </Link>
                          ) : null}
                        </div>
                        <div className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                          {c.content}
                        </div>
                        {c.post ? (
                          <div className="mt-2 text-xs text-muted-foreground">
                            On: {c.post.content.slice(0, 80)}
                            {c.post.content.length > 80 ? '…' : ''}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
