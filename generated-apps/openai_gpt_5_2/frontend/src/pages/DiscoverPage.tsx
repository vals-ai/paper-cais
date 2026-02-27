import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabaseClient'
import type { Profile } from '../lib/types'
import { includesQuery, normalizeSearchQuery } from '../lib/feed'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { ScrollArea } from '../components/ui/scroll-area'
import { Skeleton } from '../components/ui/skeleton'
import { FollowButton } from '../components/FollowButton'

function initialsFrom(str: string) {
  const parts = str.trim().split(/\s+/g).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function DiscoverPage() {
  const supabase = useMemo(() => getSupabaseClient(), [])
  const { user } = useAuth()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const q = normalizeSearchQuery(query)

  const visibleProfiles = useMemo(() => {
    return profiles
      .filter((p) => (user ? p.user_id !== user.id : true))
      .filter((p) => {
        if (!q) return true
        const hay = `${p.display_name ?? ''} ${p.bio ?? ''}`
        return includesQuery(hay, q)
      })
  }, [profiles, user, q])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)

      try {
        const [{ data: prof, error: profError }, { data: fol, error: folError }] =
          await Promise.all([
            supabase
              .from('profiles')
              .select('user_id, display_name, bio, avatar_url, updated_at')
              .order('updated_at', { ascending: false })
              .limit(100),
            user
              ? supabase
                  .from('follows')
                  .select('followee_id')
                  .eq('follower_id', user.id)
              : Promise.resolve({ data: [] as unknown[], error: null }),
          ])

        if (profError) throw profError
        if (folError) throw folError

        if (cancelled) return

        setProfiles((prof ?? []) as Profile[])
        const followRows = (fol ?? []) as unknown as { followee_id: string }[]
        setFollowing(new Set(followRows.map((f) => f.followee_id)))
      } catch (e) {
        console.error(e)
        toast.error('Could not load members')
        if (!cancelled) {
          setProfiles([])
          setFollowing(new Set())
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [supabase, user])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Discover members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or bio"
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Follow members to personalize your home feed.
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border/60 bg-card shadow-soft">
        <ScrollArea className="h-[calc(100vh-330px)]">
          <div className="space-y-3 p-4">
            {isLoading ? (
              <>
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </>
            ) : visibleProfiles.length === 0 ? (
              <div className="rounded-md border border-border/60 bg-muted p-6 text-sm text-muted-foreground">
                No members found.
              </div>
            ) : (
              visibleProfiles.map((p) => {
                const label = p.display_name?.trim() || 'Member'
                const initials = initialsFrom(label)

                return (
                  <div
                    key={p.user_id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-background p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Link to={`/profile/${p.user_id}`} className="shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={p.avatar_url ?? undefined} alt={label} />
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="min-w-0">
                        <Link
                          to={`/profile/${p.user_id}`}
                          className="truncate text-sm font-semibold hover:underline"
                        >
                          {label}
                        </Link>
                        <div className="mt-1 max-w-[42ch] truncate text-sm text-muted-foreground">
                          {p.bio || '—'}
                        </div>
                      </div>
                    </div>
                    <FollowButton
                      targetUserId={p.user_id}
                      initialFollowing={following.has(p.user_id)}
                      onChange={(next) => {
                        setFollowing((prev) => {
                          const n = new Set(prev)
                          if (next) n.add(p.user_id)
                          else n.delete(p.user_id)
                          return n
                        })
                      }}
                    />
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
