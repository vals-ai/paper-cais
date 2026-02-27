import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button } from '../components/Button'
import { Textarea } from '../components/Textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../components/Avatar'
import { Card, CardContent } from '../components/Card'
import { Heart, MessageCircle, Trash2, Edit2, Search, TrendingUp, Clock } from 'lucide-react'
import PostComposer from '../components/PostComposer'
import PostCard from '../components/PostCard'

export default function Feed() {
  const { user, profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortMode, setSortMode] = useState('newest')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPosts()
  }, [sortMode])

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          ),
          likes (id),
          comments (id)
        `)
        .order('created_at', { ascending: false })

      if (sortMode === 'trending') {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error

      // Calculate like counts and check if user liked
      const postsWithCounts = data.map(post => ({
        ...post,
        likeCount: post.likes?.length || 0,
        commentCount: post.comments?.length || 0,
      }))

      setPosts(postsWithCounts)
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = posts.filter(post => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      post.content.toLowerCase().includes(query) ||
      post.profiles?.display_name?.toLowerCase().includes(query)
    )
  })

  const handlePostCreated = () => {
    fetchPosts()
  }

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p.id !== postId))
  }

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Home Feed</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-4 py-2 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button
            variant={sortMode === 'newest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortMode('newest')}
          >
            <Clock className="h-4 w-4 mr-1" />
            Newest
          </Button>
          <Button
            variant={sortMode === 'trending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortMode('trending')}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Trending
          </Button>
        </div>
      </div>

      {user && profile && (
        <PostComposer onPostCreated={handlePostCreated} profile={profile} />
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            {searchQuery ? 'No posts found matching your search' : 'No posts yet. Be the first to post!'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onDeleted={handlePostDeleted}
              onUpdated={handlePostUpdated}
              onInteraction={fetchPosts}
            />
          ))}
        </div>
      )}
    </div>
  )
}
