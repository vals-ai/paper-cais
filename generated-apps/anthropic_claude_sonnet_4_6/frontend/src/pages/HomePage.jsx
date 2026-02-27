import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, Clock, Search, Zap } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { usePosts } from '../hooks/usePosts'
import PostCard from '../components/PostCard'
import PostComposer from '../components/PostComposer'
import PostSkeleton from '../components/PostSkeleton'
import { supabase } from '../lib/supabase'

export default function HomePage() {
  const { user, profile } = useAuth()
  const { loading, fetchFeed, fetchPersonalizedFeed, createPost } = usePosts()
  const [posts, setPosts] = useState([])
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [suggestedUsers, setSuggestedUsers] = useState([])

  const loadPosts = useCallback(async () => {
    let data
    if (user) {
      data = await fetchPersonalizedFeed(user.id, sort, search)
    } else {
      data = await fetchFeed(null, sort, search)
    }
    setPosts(data || [])
  }, [user, sort, search, fetchFeed, fetchPersonalizedFeed])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])

  useEffect(() => {
    if (user) fetchSuggestedUsers()
  }, [user])

  const fetchSuggestedUsers = async () => {
    try {
      // Get users the current user is not following, excluding themselves
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = followData?.map(f => f.following_id) || []
      const excludeIds = [...followingIds, user.id]

      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(5)

      setSuggestedUsers(data || [])
    } catch (err) {
      console.error('Error fetching suggested users:', err)
    }
  }

  const handlePost = async (content) => {
    const { data, error } = await createPost(user.id, content)
    if (!error && data) {
      setPosts(prev => [data, ...prev])
    }
  }

  const handlePostUpdate = (postId, updates) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p))
  }

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
      {/* Main feed */}
      <main className="flex-1 min-w-0 space-y-4">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search posts or #hashtags…"
              className="input w-full pl-9"
            />
          </div>
          <button type="submit" className="btn-primary btn">Search</button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput('') }}
              className="btn-outline btn"
            >
              Clear
            </button>
          )}
        </form>

        {/* Sort tabs */}
        <div className="flex items-center gap-1 p-1 bg-secondary rounded-lg w-fit">
          <button
            onClick={() => setSort('newest')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              sort === 'newest'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clock size={14} />
            Newest
          </button>
          <button
            onClick={() => setSort('trending')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              sort === 'trending'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp size={14} />
            Trending
          </button>
        </div>

        {/* Post composer */}
        {user && <PostComposer onPost={handlePost} />}

        {/* Feed */}
        <div className="space-y-3">
          {loading ? (
            Array(3).fill(0).map((_, i) => <PostSkeleton key={i} />)
          ) : posts.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-muted-foreground mb-4">
                {search ? (
                  <>
                    <Search size={48} className="mx-auto mb-4 opacity-40" />
                    <p className="text-lg font-medium">No posts found for "{search}"</p>
                    <p className="text-sm mt-1">Try different keywords or hashtags</p>
                  </>
                ) : user ? (
                  <>
                    <Zap size={48} className="mx-auto mb-4 opacity-40 text-primary" />
                    <p className="text-lg font-medium text-foreground">Your feed is empty</p>
                    <p className="text-sm mt-1">Follow other members or create your first post!</p>
                  </>
                ) : (
                  <>
                    <Zap size={48} className="mx-auto mb-4 opacity-40 text-primary" />
                    <p className="text-lg font-medium text-foreground">Welcome to Zeeter!</p>
                    <p className="text-sm mt-1">
                      <Link to="/signup" className="text-primary hover:underline">Create an account</Link>
                      {' '}or{' '}
                      <Link to="/login" className="text-primary hover:underline">sign in</Link>
                      {' '}to get started
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
              />
            ))
          )}
        </div>
      </main>

      {/* Sidebar */}
      <aside className="hidden lg:block w-72 flex-shrink-0 space-y-4">
        {!user && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={24} className="text-primary" fill="currentColor" />
              <span className="font-bold text-lg text-foreground">Zeeter</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Share quick updates and connect with your community.
            </p>
            <div className="space-y-2">
              <Link to="/signup" className="btn-primary btn w-full">Create account</Link>
              <Link to="/login" className="btn-outline btn w-full">Sign in</Link>
            </div>
          </div>
        )}

        {user && suggestedUsers.length > 0 && (
          <div className="card p-4">
            <h2 className="font-semibold text-foreground mb-3 text-sm">Who to follow</h2>
            <div className="space-y-3">
              {suggestedUsers.map(u => (
                <div key={u.id} className="flex items-center gap-3">
                  <Link to={`/profile/${u.username}`}>
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-secondary border border-border flex-shrink-0">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                          {(u.display_name || u.username)[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${u.username}`} className="text-sm font-medium text-foreground hover:underline truncate block">
                      {u.display_name || u.username}
                    </Link>
                    <span className="text-xs text-muted-foreground">@{u.username}</span>
                  </div>
                  <Link to={`/profile/${u.username}`} className="btn-outline btn-sm btn flex-shrink-0">
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground px-1">
          <p>© 2024 Zeeter · MVP Release</p>
        </div>
      </aside>
    </div>
  )
}
