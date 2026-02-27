import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { TrendingUp, Clock, Search } from 'lucide-react';

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const followingIdsRef = useRef([]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const loadFeed = async () => {
      setLoading(true);
      
      // Fetch following IDs
      let fIds = [];
      if (user) {
        try {
          const { data } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', user.id)
            .abortSignal(controller.signal);
          fIds = data?.map((f) => f.following_id) || [];
          followingIdsRef.current = fIds;
        } catch (e) { 
          if (e.name === 'AbortError') return;
        }
      }

      // Fetch posts
      try {
        let query = supabase
          .from('posts')
          .select('*, profiles:user_id(id, display_name, username, avatar_url)');

        if (searchQuery.trim()) {
          query = query.ilike('content', `%${searchQuery.trim()}%`);
        }

        query = query.order('created_at', { ascending: false }).limit(50);
        const { data, error } = await query.abortSignal(controller.signal);

        if (cancelled) return;
        if (error) {
          console.error('Feed error:', error);
          if (!cancelled) setLoading(false);
          return;
        }

        let result = data || [];

        if (sortBy === 'trending' && result.length > 0) {
          const postIds = result.map((p) => p.id);
          const { data: likeCounts } = await supabase
            .from('likes')
            .select('post_id')
            .in('post_id', postIds)
            .abortSignal(controller.signal);

          const likeMap = {};
          (likeCounts || []).forEach((l) => {
            likeMap[l.post_id] = (likeMap[l.post_id] || 0) + 1;
          });

          result.sort((a, b) => {
            const aLikes = likeMap[a.id] || 0;
            const bLikes = likeMap[b.id] || 0;
            return bLikes - aLikes;
          });
        }

        // For logged in users, mix followed and community content
        if (user && fIds.length > 0 && sortBy === 'newest' && !searchQuery.trim()) {
          const followed = result.filter((p) => fIds.includes(p.user_id) || p.user_id === user.id);
          const community = result.filter((p) => !fIds.includes(p.user_id) && p.user_id !== user.id);
          result = [...followed, ...community];
        }

        if (!cancelled) setPosts(result);
      } catch (e) {
        if (e.name === 'AbortError') return;
        console.error('Feed error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Timeout to avoid infinite loading
    const timeout = setTimeout(() => {
      if (!cancelled) {
        controller.abort();
        setLoading(false);
      }
    }, 10000);

    loadFeed();
    return () => { 
      cancelled = true; 
      clearTimeout(timeout);
      controller.abort();
    };
  }, [sortBy, searchQuery, user]);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Create Post */}
      {user && <CreatePost onPostCreated={handlePostCreated} />}

      {/* Filters */}
      <div className="card p-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts or #hashtags..."
              className="input-field pl-10 text-sm"
            />
          </div>
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setSortBy('newest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                sortBy === 'newest'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Newest
            </button>
            <button
              onClick={() => setSortBy('trending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                sortBy === 'trending'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Trending
            </button>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <LoadingSpinner text="Loading feed..." />
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-muted-foreground text-lg">
            {searchQuery ? 'No posts found matching your search.' : 'No posts yet. Be the first to share!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handlePostDeleted}
              onUpdate={handlePostUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
