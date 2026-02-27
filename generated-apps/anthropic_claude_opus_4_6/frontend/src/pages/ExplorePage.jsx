import { useState, useEffect, useCallback } from 'react';
import { Search, Users, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import UserCard from '../components/UserCard';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ExplorePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [followingIds, setFollowingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFollowing = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);
    setFollowingIds(new Set(data?.map((f) => f.following_id) || []));
  }, [user]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*');
    if (searchQuery.trim()) {
      query = query.or(
        `display_name.ilike.%${searchQuery.trim()}%,username.ilike.%${searchQuery.trim()}%,bio.ilike.%${searchQuery.trim()}%`
      );
    }
    query = query.order('created_at', { ascending: false }).limit(50);
    const { data } = await query;
    setUsers(data || []);
    setLoading(false);
  }, [searchQuery]);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select('*, profiles:user_id(id, display_name, username, avatar_url)');
    if (searchQuery.trim()) {
      query = query.ilike('content', `%${searchQuery.trim()}%`);
    }
    query = query.order('created_at', { ascending: false }).limit(50);
    const { data } = await query;
    setPosts(data || []);
    setLoading(false);
  }, [searchQuery]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  useEffect(() => {
    if (tab === 'users') {
      fetchUsers();
    } else {
      fetchPosts();
    }
  }, [tab, fetchUsers, fetchPosts]);

  const toggleFollow = async (profileId) => {
    if (!user) return;
    if (followingIds.has(profileId)) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileId);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(profileId);
        return next;
      });
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: profileId });
      setFollowingIds((prev) => new Set([...prev, profileId]));
      // Notification
      await supabase.from('notifications').insert({
        user_id: profileId,
        actor_id: user.id,
        type: 'follow',
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="card p-4">
        <h1 className="text-xl font-bold text-foreground mb-4">Explore</h1>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tab === 'users' ? 'Search users...' : 'Search posts or #hashtags...'}
            className="input-field pl-10"
          />
        </div>

        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <button
            onClick={() => setTab('users')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              tab === 'users'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setTab('posts')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              tab === 'posts'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Hash className="w-4 h-4" />
            Posts
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Searching..." />
      ) : tab === 'users' ? (
        users.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((profile) => (
              <UserCard
                key={profile.id}
                profile={profile}
                isFollowing={followingIds.has(profile.id)}
                onToggleFollow={toggleFollow}
                currentUserId={user?.id}
              />
            ))}
          </div>
        )
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-muted-foreground">No posts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
