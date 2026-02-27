import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import PostCard from '../components/PostCard';

export default function Profile() {
  const { userId } = useParams();
  const { user, profile: currentProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    display_name: '',
    bio: '',
    avatar_url: ''
  });

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    fetchProfile();
    fetchPosts();
    if (!isOwnProfile && user) {
      checkFollowStatus();
    }
  }, [userId, user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditData({
        display_name: data.display_name || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || ''
      });

      // Get followers and following counts
      const [followers, following] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId)
      ]);
      
      setFollowersCount(followers.count || 0);
      setFollowingCount(following.count || 0);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
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
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const checkFollowStatus = async () => {
    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .single();
    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!user) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
        setFollowersCount(followersCount - 1);
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
        setFollowersCount(followersCount + 1);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: editData.display_name,
          bio: editData.bio,
          avatar_url: editData.avatar_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-full bg-background-tertiary animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-background-tertiary rounded w-1/3 animate-pulse" />
              <div className="h-4 bg-background-tertiary rounded w-1/2 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <h2 className="text-xl font-medium text-foreground mb-2">Profile not found</h2>
        <p className="text-foreground-secondary">This user doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6 shadow-sm">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              {editData.avatar_url ? (
                <img
                  src={editData.avatar_url}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-background-tertiary flex items-center justify-center border-4 border-primary/20">
                  <svg className="w-12 h-12 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Avatar URL</label>
              <input
                type="url"
                value={editData.avatar_url}
                onChange={(e) => setEditData({ ...editData, avatar_url: e.target.value })}
                className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Display Name</label>
              <input
                type="text"
                value={editData.display_name}
                onChange={(e) => setEditData({ ...editData, display_name: e.target.value })}
                maxLength={50}
                className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Bio</label>
              <textarea
                value={editData.bio}
                onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                maxLength={160}
                rows={3}
                className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-foreground-secondary hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-background-tertiary flex items-center justify-center">
                  <svg className="w-12 h-12 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{profile.display_name}</h1>
                    <p className="text-foreground-muted">@{userId.slice(0, 8)}</p>
                  </div>
                  {isOwnProfile ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 border border-border rounded-lg font-medium text-foreground hover:bg-background-secondary transition-colors"
                    >
                      Edit Profile
                    </button>
                  ) : user ? (
                    <button
                      onClick={handleFollow}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        isFollowing
                          ? 'border border-border text-foreground hover:bg-error/10 hover:text-error hover:border-error'
                          : 'bg-primary text-white hover:bg-primary-hover'
                      }`}
                    >
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  ) : null}
                </div>
                {profile.bio && (
                  <p className="mt-3 text-foreground">{profile.bio}</p>
                )}
                <div className="flex gap-4 mt-4">
                  <div>
                    <span className="font-bold text-foreground">{posts.length}</span>
                    <span className="text-foreground-muted ml-1">posts</span>
                  </div>
                  <div>
                    <span className="font-bold text-foreground">{followersCount}</span>
                    <span className="text-foreground-muted ml-1">followers</span>
                  </div>
                  <div>
                    <span className="font-bold text-foreground">{followingCount}</span>
                    <span className="text-foreground-muted ml-1">following</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Posts</h2>
        {posts.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <p className="text-foreground-secondary">No posts yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={fetchPosts} />
          ))
        )}
      </div>
    </div>
  );
}
