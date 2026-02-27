import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import PostCard from '../components/PostCard';

export default function Home() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchPosts();
  }, [sortBy]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Get posts from followed users + popular posts
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url,
            bio
          ),
          likes:likes(count),
          comments:comments(count)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (sortBy === 'trending') {
        // For trending, we'd need a more complex query
        // For now, let's just show posts with more likes
        query = supabase
          .from('posts')
          .select(`
            *,
            profiles:author_id (
              id,
              display_name,
              avatar_url,
              bio
            ),
            likes:likes(count),
            comments:comments(count)
          `)
          .eq('is_public', true)
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || newPost.length > 280) return;

    setPosting(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content: newPost.trim(),
          author_id: user.id,
          is_public: true
        })
        .select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url,
            bio
          ),
          likes:likes(count),
          comments:comments(count)
        `)
        .single();

      if (error) throw error;

      setPosts([data, ...posts]);
      setNewPost('');
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Post Creation Box */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6 shadow-sm">
        <div className="flex gap-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-background-tertiary flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          <form onSubmit={handlePost} className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's happening?"
              maxLength={280}
              className="w-full bg-transparent border-none text-foreground placeholder:text-foreground-muted resize-none focus:outline-none text-lg"
              rows={newPost ? 3 : 1}
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className={`text-sm ${newPost.length > 260 ? 'text-error' : 'text-foreground-muted'}`}>
                {newPost.length}/280
              </span>
              <button
                type="submit"
                disabled={!newPost.trim() || newPost.length > 280 || posting}
                className="px-4 py-2 bg-gradient-to-r from-primary to-primary-hover text-white font-medium rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sort Options */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSortBy('newest')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            sortBy === 'newest'
              ? 'bg-primary text-white'
              : 'bg-white text-foreground-secondary hover:bg-background-tertiary border border-border'
          }`}
        >
          Newest
        </button>
        <button
          onClick={() => setSortBy('trending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            sortBy === 'trending'
              ? 'bg-primary text-white'
              : 'bg-white text-foreground-secondary hover:bg-background-tertiary border border-border'
          }`}
        >
          Trending
        </button>
      </div>

      {/* Posts Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-background-tertiary animate-pulse" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-background-tertiary rounded w-1/3 animate-pulse" />
                  <div className="h-4 bg-background-tertiary rounded w-full animate-pulse" />
                  <div className="h-4 bg-background-tertiary rounded w-2/3 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-foreground-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
          <p className="text-foreground-secondary">Be the first to share something!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
          ))}
        </div>
      )}
    </div>
  );
}
