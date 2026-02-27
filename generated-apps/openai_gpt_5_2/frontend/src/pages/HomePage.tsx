import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Hash, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabaseClient'
import type { FeedPost, PostRecord } from '../lib/types'
import { computeTrendScore, includesQuery, normalizeSearchQuery } from '../lib/feed'
import { toOne } from '../lib/toOne'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ScrollArea } from '../components/ui/scroll-area'
import { Skeleton } from '../components/ui/skeleton'
import { PostComposer } from '../components/PostComposer'
import { PostCard } from '../components/PostCard'
import { Button } from '../components/ui/button'

type SortMode = 'newest' | 'trending'

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
    trendScore: computeTrendScore({
      likesCount,
      commentsCount,
      createdAtIso: p.created_at,
    }),
  }
}

export function HomePage() {
  const supabase = useMemo(() => getSupabaseClient(), [])
  const { user } = useAuth()

  const [params, setParams] = useSearchParams()

  const [sort, setSort] = useState<SortMode>('newest')
  const [query, setQuery] = useState(() => params.get('q') ?? '')

  const [rawPosts, setRawPosts] = useState<FeedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const queryNormalized = normalizeSearchQuery(query)

  useEffect(() => {
    const q = params.get('q') ?? ''
    setQuery(q)
  }, [params])

  const visiblePosts = useMemo(() => {
    const q = queryNormalized

    const filtered = rawPosts.filter((p) => {
      if (!q) return true
      return includesQuery(p.content, q)
    })

    const sorted = [...filtered]
    if (sort === 'newest') {
      sorted.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    } else {
      sorted.sort((a, b) => {
        if (b.trendScore !== a.trendScore) return b.trendScore - a.trendScore
        return a.created_at < b.created_at ? 1 : -1
      })
    }

    return sorted
  }, [rawPosts, sort, queryNormalized])

  async function fetchFeed() {
    setIsLoading(true)

    try {
      const viewerId = user?.id ?? null

      let followedIds: string[] = []
      if (viewerId) {
        const { data: follows, error: followsError } = await supabase
          .from('follows')
          .select('followee_id')
          .eq('follower_id', viewerId)

        if (followsError) throw followsError
        followedIds = (follows ?? []).map((f) => f.followee_id)
      }

      const idsForPersonal = viewerId ? [viewerId, ...followedIds] : []

      const baseSelect =
        'id, content, created_at, updated_at, user_id, profiles!posts_user_id_fkey(user_id, display_name, bio, avatar_url), likes(count), comments(count)'

      const personalPromise = viewerId
        ? supabase
            .from('posts')
            .select(baseSelect)
            .in('user_id', idsForPersonal.length ? idsForPersonal : [viewerId])
            .order('created_at', { ascending: false })
            .limit(60)
        : Promise.resolve({ data: [] as unknown[], error: null })

      const communityPromise = supabase
        .from('posts')
        .select(baseSelect)
        .order('created_at', { ascending: false })
        .limit(90)

      const [{ data: personalData, error: personalError }, { data: communityData, error: communityError }] =
        await Promise.all([personalPromise, communityPromise])

      if (personalError) throw personalError
      if (communityError) throw communityError

      const mergedMap = new Map<string, PostRecord>()
      for (const p of (personalData ?? []) as PostRecord[]) mergedMap.set(p.id, p)
      for (const p of (communityData ?? []) as PostRecord[]) mergedMap.set(p.id, p)

      const merged = Array.from(mergedMap.values())

      let likedSet = new Set<string>()
      if (viewerId && merged.length) {
        const { data: liked, error: likedError } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', viewerId)
          .in(
            'post_id',
            merged.map((p) => p.id),
          )

        if (likedError) throw likedError
        likedSet = new Set((liked ?? []).map((l) => l.post_id))
      }

      setRawPosts(merged.map((p) => mapPost(p, likedSet.has(p.id))))
    } catch (e) {
      console.error(e)
      toast.error('Could not load feed')
      setRawPosts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  return (
    <div className="space-y-6">
      {user ? (
        <PostComposer onPosted={fetchFeed} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Explore Zeeter</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Browse public posts and profiles. Create an account to follow members, like posts, and
              join comment threads.
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => setSort('trending')}>
                Trending
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  setParams((prev) => {
                    const next = new URLSearchParams(prev)
                    next.set('q', '#welcome')
                    return next
                  })
                }
                className="gap-2"
              >
                <Hash className="h-4 w-4" /> #welcome
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="rounded-lg border border-border/60 bg-card shadow-soft">
        <div className="flex flex-col gap-3 border-b border-border/60 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-semibold">Feed</div>
            <Tabs value={sort} onValueChange={(v) => setSort(v as SortMode)}>
              <TabsList>
                <TabsTrigger value="newest">Newest</TabsTrigger>
                <TabsTrigger value="trending">Trending</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="relative w-full md:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                const next = e.target.value
                setQuery(next)
                setParams((prev) => {
                  const nextParams = new URLSearchParams(prev)
                  if (next.trim()) nextParams.set('q', next)
                  else nextParams.delete('q')
                  return nextParams
                })
              }}
              placeholder="Search posts or #hashtags"
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="h-[calc(100vh-340px)]">
          <div className="space-y-4 p-4">
            {isLoading ? (
              <>
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-28 w-full" />
              </>
            ) : visiblePosts.length === 0 ? (
              <div className="rounded-md border border-border/60 bg-muted p-6 text-sm text-muted-foreground">
                No posts found.
              </div>
            ) : (
              visiblePosts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  onChanged={fetchFeed}
                  onDeleted={() => fetchFeed()}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
