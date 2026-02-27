import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import ComposeBox from '../components/ComposeBox';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { TrendingUp, Clock, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export default function HomePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(id, username, display_name, avatar_url),
          likes(id, user_id),
          comments(id)
        `);

      if (searchQuery.trim()) {
        query = query.ilike('content', `%${searchQuery.trim()}%`);
      }

      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } else {
        let processed = (data || []).map(post => ({
          ...post,
          like_count: post.likes?.length || 0,
          comment_count: post.comments?.length || 0,
          user_liked: user ? post.likes?.some(l => l.user_id === user.id) : false,
        }));

        if (sortBy === 'trending') {
          processed.sort((a, b) => {
            const scoreA = a.like_count * 2 + a.comment_count * 3;
            const scoreB = b.like_count * 2 + b.comment_count * 3;
            return scoreB - scoreA;
          });
        }

        setPosts(processed);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  }, [user, sortBy, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          {user ? 'Home Feed' : 'Public Feed'}
        </h1>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search posts by keyword or #hashtag..."
          className="input-field pl-10"
        />
      </div>

      {/* Sort tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSortBy('newest')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            sortBy === 'newest' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
          )}
        >
          <Clock className="h-4 w-4" />
          Newest
        </button>
        <button
          onClick={() => setSortBy('trending')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            sortBy === 'trending' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent'
          )}
        >
          <TrendingUp className="h-4 w-4" />
          Trending
        </button>
      </div>

      {/* Compose box */}
      {user && <ComposeBox onPost={fetchPosts} />}

      {/* Posts */}
      {loading ? (
        <LoadingSpinner />
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {searchQuery ? 'No posts match your search' : 'No posts yet. Be the first to post!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onUpdate={fetchPosts}
              onDelete={handlePostDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
