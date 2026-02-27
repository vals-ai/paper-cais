import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Users, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { usePosts } from '../hooks/usePosts'
import PostCard from '../components/PostCard'
import PostSkeleton from '../components/PostSkeleton'
import Avatar from '../components/Avatar'
import FollowButton from '../components/FollowButton'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [inputValue, setInputValue] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [users, setUsers] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const { fetchFeed } = usePosts()

  useEffect(() => {
    if (query) {
      searchPosts(query)
      searchUsers(query)
    }
  }, [query])

  const searchPosts = async (q) => {
    setPostsLoading(true)
    try {
      const data = await fetchFeed(null, 'newest', q)
      setPosts(data || [])
    } finally {
      setPostsLoading(false)
    }
  }

  const searchUsers = async (q) => {
    setUsersLoading(true)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url')
        .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
        .limit(20)
      setUsers(data || [])
    } finally {
      setUsersLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return
    const trimmed = inputValue.trim()
    setQuery(trimmed)
    setSearchParams({ q: trimmed })
  }

  const handlePostUpdate = (postId, updates) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p))
  }

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">Explore</h1>
        <p className="text-muted-foreground text-sm">Search for posts, people, and hashtags</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Search posts, #hashtags, or @users…"
            className="input w-full pl-9"
            autoFocus
          />
        </div>
        <button type="submit" className="btn-primary btn">Search</button>
      </form>

      {/* Results */}
      {query ? (
        <div>
          {/* Tabs */}
          <div className="flex border-b border-border mb-4">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'posts'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText size={14} />
              Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users size={14} />
              People ({users.length})
            </button>
          </div>

          {activeTab === 'posts' && (
            <div className="space-y-3">
              {postsLoading ? (
                Array(3).fill(0).map((_, i) => <PostSkeleton key={i} />)
              ) : posts.length === 0 ? (
                <div className="card p-12 text-center text-muted-foreground">
                  <Search size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No posts found for "{query}"</p>
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
          )}

          {activeTab === 'users' && (
            <div className="space-y-2">
              {usersLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <div key={i} className="card p-4 flex gap-3 animate-pulse">
                    <div className="skeleton w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="skeleton h-4 w-32 rounded" />
                      <div className="skeleton h-3 w-48 rounded" />
                    </div>
                  </div>
                ))
              ) : users.length === 0 ? (
                <div className="card p-12 text-center text-muted-foreground">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No users found for "{query}"</p>
                </div>
              ) : (
                users.map(u => (
                  <div key={u.id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                    <Link to={`/profile/${u.username}`}>
                      <Avatar src={u.avatar_url} size="md" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${u.username}`} className="font-semibold text-foreground hover:underline">
                        {u.display_name || u.username}
                      </Link>
                      <p className="text-sm text-muted-foreground">@{u.username}</p>
                      {u.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{u.bio}</p>}
                    </div>
                    <FollowButton targetUserId={u.id} />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Search size={48} className="mx-auto mb-4 opacity-20 text-muted-foreground" />
          <p className="text-foreground font-medium mb-1">Discover people & posts</p>
          <p className="text-sm text-muted-foreground">
            Search by name, username, keyword, or #hashtag
          </p>
        </div>
      )}
    </div>
  )
}
