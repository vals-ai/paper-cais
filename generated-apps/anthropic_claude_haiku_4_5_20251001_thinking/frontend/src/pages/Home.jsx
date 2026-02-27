import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PostCard } from '../components/PostCard'

export const Home = () => {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState('newest')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  const loadPosts = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('posts')
        .select('*')

      // Apply search filter
      if (searchQuery) {
        query = query.or(`content.ilike.%${searchQuery}%`)
      }

      // Apply sorting
      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
      } else if (sortBy === 'trending') {
        query = query.order('likes_count', { ascending: false })
      }

      const { data } = await query.limit(50)
      setPosts(data || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [sortBy, searchQuery])

  const handleSubmitPost = async (e) => {
    e.preventDefault()
    
    if (!user) {
      navigate('/login')
      return
    }

    if (!newPost.trim() || newPost.length > 280) {
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: newPost,
        })

      if (error) throw error

      setNewPost('')
      await loadPosts()
    } catch (error) {
      console.error('Error creating post:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* New Post Box */}
        {user && (
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-6 mb-6">
            <div className="flex gap-4 mb-4">
              {profile?.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt={profile?.display_name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              )}
              <form onSubmit={handleSubmitPost} className="flex-1 space-y-3">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value.slice(0, 280))}
                  placeholder="What's happening?!"
                  className="w-full px-4 py-2 rounded-lg border border-neutral-300 text-neutral-900 placeholder-neutral-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed min-h-24 resize-none p-3"
                />
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${
                    newPost.length > 280 ? 'text-accent-600 font-bold' : 'text-neutral-500'
                  }`}>
                    {newPost.length} / 280
                  </span>
                  <button
                    type="submit"
                    disabled={submitting || !newPost.trim() || newPost.length > 280}
                    className="btn-primary py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting...' : 'Post'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 mb-6 p-4 space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="w-full px-4 py-2 rounded-lg border border-neutral-300 text-neutral-900 placeholder-neutral-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Search for keywords or hashtags
            </p>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Sort By
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy('newest')}
                className={`btn py-2 px-4 text-sm ${
                  sortBy === 'newest'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy('trending')}
                className={`btn py-2 px-4 text-sm ${
                  sortBy === 'trending'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                Trending
              </button>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 p-6 animate-pulse">
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 p-8 text-center">
            <p className="text-neutral-500 mb-4">
              No posts yet. Be the first to post!
            </p>
            {!user && (
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 transition-all duration-200 cursor-pointer"
              >
                Sign in to post
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLikeChange={loadPosts}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
