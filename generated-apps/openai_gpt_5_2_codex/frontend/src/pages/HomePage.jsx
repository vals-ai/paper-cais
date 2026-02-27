import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import PostComposer from '../components/PostComposer'
import PostCard from '../components/PostCard'
import Input from '../components/Input'
import EmptyState from '../components/EmptyState'
import Loader from '../components/Loader'
import MemberCard from '../components/MemberCard'

const HomePage = ({ mode = 'home' }) => {
  const { user, profile } = useAuth()
  const [rawPosts, setRawPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [followingIds, setFollowingIds] = useState([])
  const [suggestedMembers, setSuggestedMembers] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const primaryLinkClass =
    'inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90'

  const loadFeed = async () => {
    setLoading(true)

    setErrorMessage('')
    const { data: postsData, error } = await supabase
      .from('posts')
      .select(
        'id, content, created_at, updated_at, author_id, profiles:author_id(id, display_name, avatar_url), likes(count), comments(count)'
      )
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      setErrorMessage('Unable to load the feed right now.')
      setLoading(false)
      return
    }

    const postIds = postsData?.map((post) => post.id) ?? []
    let likedPostIds = []
    let followIds = []

    if (user) {
      const { data: likesData } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds)

      likedPostIds = likesData?.map((like) => like.post_id) ?? []

      const { data: followsData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      followIds = followsData?.map((follow) => follow.following_id) ?? []
      setFollowingIds(followIds)
    } else {
      setFollowingIds([])
    }

    const mapped = (postsData ?? []).map((post) => {
      const likeCount = post.likes?.[0]?.count ?? 0
      const commentCount = post.comments?.[0]?.count ?? 0
      return {
        ...post,
        author: post.profiles,
        likeCount,
        commentCount,
        isLiked: likedPostIds.includes(post.id),
        isFollowedAuthor: followIds.includes(post.author_id)
      }
    })

    setRawPosts(mapped)
    setLoading(false)
  }

  const loadSuggestions = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .limit(6)

    if (data) {
      const filtered = user ? data.filter((member) => member.id !== user.id) : data
      setSuggestedMembers(filtered)
    }
  }

  useEffect(() => {
    loadFeed()
    loadSuggestions()
  }, [user])

  const combinedPosts = useMemo(() => {
    if (!user) return rawPosts

    const trending = [...rawPosts].sort((a, b) => b.likeCount - a.likeCount).slice(0, 10)
    const followed = rawPosts.filter((post) => followingIds.includes(post.author_id))
    const merged = [...followed, ...trending]
    const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values())
    return unique.length ? unique : rawPosts
  }, [rawPosts, followingIds, user])

  const displayedPosts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const list = query
      ? combinedPosts.filter((post) => {
          const text = post.content.toLowerCase()
          const author = post.author?.display_name?.toLowerCase() || ''
          return text.includes(query) || author.includes(query)
        })
      : combinedPosts

    return [...list].sort((a, b) => {
      if (sort === 'trending') {
        return b.likeCount - a.likeCount || new Date(b.created_at) - new Date(a.created_at)
      }
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [combinedPosts, search, sort])

  const handleCreatePost = async (content) => {
    setErrorMessage('')
    const { error } = await supabase
      .from('posts')
      .insert({ author_id: user.id, content })
    if (error) {
      setErrorMessage('Unable to publish your update right now.')
      return
    }
    await loadFeed()
  }

  const handleLikeToggle = async (post) => {
    if (!user) return
    setErrorMessage('')

    if (post.isLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id)
      if (error) {
        setErrorMessage('Unable to remove your like right now.')
        return
      }
      setRawPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? { ...item, isLiked: false, likeCount: Math.max(item.likeCount - 1, 0) }
            : item
        )
      )
    } else {
      const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
      if (error) {
        setErrorMessage('Unable to like this post right now.')
        return
      }
      setRawPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? { ...item, isLiked: true, likeCount: item.likeCount + 1 }
            : item
        )
      )
    }
  }

  const handleDeletePost = async (postId) => {
    setErrorMessage('')
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) {
      setErrorMessage('Unable to delete this post right now.')
      return
    }
    setRawPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  const handleUpdatePost = async (postId, content) => {
    setErrorMessage('')
    const { error } = await supabase.from('posts').update({ content }).eq('id', postId)
    if (error) {
      setErrorMessage('Unable to update this post right now.')
      return
    }
    setRawPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, content } : post)))
  }

  const handleCommentAdded = (postId) => {
    setRawPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post
      )
    )
  }

  const handleFollow = async (memberId) => {
    if (!user) return
    setErrorMessage('')
    const isFollowing = followingIds.includes(memberId)

    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', memberId)
      if (error) {
        setErrorMessage('Unable to update your follow right now.')
        return
      }
      setFollowingIds((prev) => prev.filter((id) => id !== memberId))
    } else {
      const { error } = await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: memberId
      })
      if (error) {
        setErrorMessage('Unable to follow this member right now.')
        return
      }
      setFollowingIds((prev) => [...prev, memberId])
    }
  }

  const isExplore = mode === 'explore'

  return (
    <div className="bg-background">
      {!user && !isExplore && (
        <section className="border-b border-border bg-card">
          <div className="app-container py-12">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <span className="chip">Community updates</span>
                <h1 className="text-4xl font-semibold text-foreground">
                  Discover quick takes and thoughtful conversations.
                </h1>
                <p className="text-base text-muted-foreground">
                  Join Zeeter to follow members, post updates, and stay on top of notifications.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/auth" className={primaryLinkClass}>
                    Join Zeeter
                  </Link>
                  <Link
                    to="/explore"
                    className="rounded-full border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/70"
                  >
                    Browse public feed
                  </Link>
                </div>
              </div>
              <div className="surface-muted p-6">
                <h2 className="text-lg font-semibold text-foreground">What you can do</h2>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  <li>• Share updates in under 280 characters.</li>
                  <li>• Follow members for a personalized feed.</li>
                  <li>• Track likes, comments, and new followers.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="app-container grid gap-8 py-10 lg:grid-cols-[2fr_1fr]">
        <main className="space-y-6">
          {user && !isExplore && (
            <PostComposer onSubmit={handleCreatePost} />
          )}

          <div className="surface-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="section-title">{isExplore ? 'Explore' : 'Your feed'}</h2>
                <p className="section-subtitle">
                  {user
                    ? 'A mix of followed creators and trending updates.'
                    : 'Public updates from the community.'}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search posts or #hashtags"
                  className="w-56"
                />
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                  className="rounded-xl border border-input bg-background px-4 py-2 text-sm text-foreground"
                >
                  <option value="newest">Newest</option>
                  <option value="trending">Trending</option>
                </select>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="surface-muted px-4 py-3 text-sm text-warning">
              {errorMessage}
            </div>
          )}

          {loading ? (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="surface-card animate-pulse p-6">
                  <div className="h-4 w-32 rounded-full bg-muted" />
                  <div className="mt-4 h-3 w-full rounded-full bg-muted" />
                  <div className="mt-2 h-3 w-5/6 rounded-full bg-muted" />
                </div>
              ))}
            </div>
          ) : displayedPosts.length ? (
            <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
              {displayedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onLikeToggle={handleLikeToggle}
                  onDelete={handleDeletePost}
                  onUpdate={handleUpdatePost}
                  onCommentAdded={handleCommentAdded}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No posts yet"
              description="Start following members or create your first update to fill the feed."
              action={
                user ? null : (
                  <Link to="/auth" className={primaryLinkClass}>
                    Create an account
                  </Link>
                )
              }
            />
          )}
        </main>

        <aside className="space-y-6">
          {user ? (
            <div className="surface-card p-6">
              <h3 className="text-lg font-semibold text-foreground">Your profile</h3>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">{profile?.display_name || 'Member'}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.bio || 'Add a short bio to introduce yourself.'}
                </p>
                <Link
                  to="/settings"
                  className="text-sm font-semibold text-primary hover:text-primary/80"
                >
                  Edit profile
                </Link>
              </div>
            </div>
          ) : (
            <div className="surface-card p-6">
              <h3 className="text-lg font-semibold text-foreground">Explore Zeeter</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to follow members, like updates, and post your own stories.
              </p>
              <Link to="/auth" className={`${primaryLinkClass} mt-4 w-full`}>
                Sign in
              </Link>
            </div>
          )}

          <div className="surface-card p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Discover members</h3>
              {loading && <Loader label="Refreshing" />}
            </div>
            <div className="mt-4 space-y-3">
              {suggestedMembers.length ? (
                suggestedMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    profile={member}
                    isFollowing={followingIds.includes(member.id)}
                    onFollow={user ? handleFollow : null}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No members to show yet.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default HomePage
