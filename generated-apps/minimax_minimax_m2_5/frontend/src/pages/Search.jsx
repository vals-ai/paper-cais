import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function Search() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      setQuery(q);
      handleSearch(q);
    }
  }, []);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setUsers([]);
      setPosts([]);
      return;
    }

    setLoading(true);
    try {
      // Search users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .or(`display_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
        .limit(20);

      // Search posts
      const { data: postsData } = await supabase
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
        .or(`content.ilike.%${searchQuery}%`)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      setUsers(usersData || []);
      setPosts(postsData || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch(query);
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('q', query);
    window.history.pushState({}, '', url);
  };

  const handleFollow = async (userId, isCurrentlyFollowing) => {
    if (!user) return;

    try {
      if (isCurrentlyFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
        
        // Create notification
        if (userId !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              type: 'follow',
              from_user_id: user.id
            });
        }
      }
      
      // Refresh user list
      setUsers(users.map(u => {
        if (u.id === userId) {
          return { ...u, is_following: !isCurrentlyFollowing };
        }
        return u;
      }));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  // Check follow status for users
  useEffect(() => {
    if (!user || users.length === 0) return;

    const checkFollowStatus = async () => {
      const userIds = users.map(u => u.id);
      const { data } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', userIds);

      const followingIds = new Set(data.map(d => d.following_id));
      setUsers(users.map(u => ({
        ...u,
        is_following: followingIds.has(u.id)
      })));
    };

    checkFollowStatus();
  }, [user, users.length]);

  const displayUsers = activeTab === 'users' || activeTab === 'all' ? users : [];
  const displayPosts = activeTab === 'posts' || activeTab === 'all' ? posts : [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Search Form */}
      <div className="bg-white rounded-xl border border-border p-4 mb-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for users or posts..."
              className="w-full px-4 py-3 pl-10 bg-background-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Tabs */}
      {(users.length > 0 || posts.length > 0) && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-primary text-white'
                : 'bg-white text-foreground-secondary hover:bg-background-tertiary border border-border'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-primary text-white'
                : 'bg-white text-foreground-secondary hover:bg-background-tertiary border border-border'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'posts'
                ? 'bg-primary text-white'
                : 'bg-white text-foreground-secondary hover:bg-background-tertiary border border-border'
            }`}
          >
            Posts ({posts.length})
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 animate-pulse">
              <div className="h-4 bg-background-tertiary rounded w-1/3 mb-2" />
              <div className="h-3 bg-background-tertiary rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && query && (
        <>
          {/* Users */}
          {displayUsers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">Users</h2>
              <div className="space-y-2">
                {displayUsers.map((profile) => (
                  <div key={profile.id} className="bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <Link to={`/profile/${profile.id}`}>
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.display_name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-background-tertiary flex items-center justify-center">
                            <svg className="w-6 h-6 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${profile.id}`} className="font-medium text-foreground hover:underline block">
                          {profile.display_name}
                        </Link>
                        {profile.bio && (
                          <p className="text-sm text-foreground-muted truncate">{profile.bio}</p>
                        )}
                      </div>
                      {user && user.id !== profile.id && (
                        <button
                          onClick={() => handleFollow(profile.id, profile.is_following)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            profile.is_following
                              ? 'border border-border text-foreground hover:bg-error/10 hover:text-error hover:border-error'
                              : 'bg-primary text-white hover:bg-primary-hover'
                          }`}
                        >
                          {profile.is_following ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts */}
          {displayPosts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Posts</h2>
              <div className="space-y-4">
                {displayPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/profile/${post.author_id}`}
                    className="block bg-white rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-4">
                      {post.profiles?.avatar_url ? (
                        <img
                          src={post.profiles.avatar_url}
                          alt={post.profiles.display_name}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-background-tertiary flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{post.profiles?.display_name}</span>
                          <span className="text-foreground-muted text-sm">@{post.profiles?.id?.slice(0, 8)}</span>
                        </div>
                        <p className="text-foreground line-clamp-3">{post.content}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {displayUsers.length === 0 && displayPosts.length === 0 && (
            <div className="bg-white rounded-xl border border-border p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-foreground-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium text-foreground mb-2">No results found</h3>
              <p className="text-foreground-secondary">Try different keywords</p>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !query && (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-foreground-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium text-foreground mb-2">Search for anything</h3>
          <p className="text-foreground-secondary">Find users and posts</p>
        </div>
      )}
    </div>
  );
}
