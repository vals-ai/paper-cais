import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import FollowButton from '../components/FollowButton';
import LoadingSpinner from '../components/LoadingSpinner';
import { Camera, Pencil, Check, X, MapPin } from 'lucide-react';

export default function ProfilePage() {
  const { username } = useParams();
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });
  const [uploading, setUploading] = useState(false);

  const isOwnProfile = user?.id === profile?.id;

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);

    // Fetch stats
    const [followersRes, followingRes, postsRes] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', profileData.id),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', profileData.id),
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', profileData.id),
    ]);

    setStats({
      followers: followersRes.count || 0,
      following: followingRes.count || 0,
      posts: postsRes.count || 0,
    });

    // Fetch posts
    const { data: postsData } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id(id, username, display_name, avatar_url),
        likes(id, user_id),
        comments(id)
      `)
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false })
      .limit(30);

    const processed = (postsData || []).map(post => ({
      ...post,
      like_count: post.likes?.length || 0,
      comment_count: post.comments?.length || 0,
      user_liked: user ? post.likes?.some(l => l.user_id === user.id) : false,
    }));

    setPosts(processed);
    setLoading(false);
  }, [username, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async () => {
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editData.display_name,
        bio: editData.bio,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (!error) {
      setEditing(false);
      await refreshProfile();
      fetchProfile();
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      await refreshProfile();
      fetchProfile();
    }
    setUploading(false);
  };

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setStats(prev => ({ ...prev, posts: prev.posts - 1 }));
  };

  if (loading) return <LoadingSpinner />;

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">User not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative group">
            <Avatar
              src={profile.avatar_url}
              name={profile.display_name || profile.username}
              size="xl"
            />
            {isOwnProfile && (
              <label className="absolute inset-0 flex items-center justify-center rounded-full bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="h-6 w-6 text-background" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editData.display_name || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Display name"
                  className="input-field"
                />
                <textarea
                  value={editData.bio || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Write a short bio..."
                  className="input-field min-h-[60px] resize-none"
                  maxLength={160}
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} className="btn-primary text-sm gap-1">
                    <Check className="h-4 w-4" /> Save
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-ghost text-sm gap-1">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    {profile.display_name || profile.username}
                  </h1>
                  {isOwnProfile && (
                    <button
                      onClick={() => {
                        setEditing(true);
                        setEditData({ display_name: profile.display_name, bio: profile.bio });
                      }}
                      className="btn-ghost p-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-muted-foreground">@{profile.username}</p>
                {profile.bio && <p className="text-foreground mt-2">{profile.bio}</p>}
              </>
            )}

            <div className="flex gap-6 mt-4">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{stats.posts}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{stats.followers}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{stats.following}</p>
                <p className="text-xs text-muted-foreground">Following</p>
              </div>
            </div>
          </div>

          {user && !isOwnProfile && (
            <FollowButton
              targetUserId={profile.id}
              currentUserId={user.id}
              onFollowChange={fetchProfile}
            />
          )}
        </div>
      </div>

      {/* Posts */}
      <h2 className="text-lg font-semibold text-foreground mb-4">Recent Posts</h2>
      {posts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No posts yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              onUpdate={fetchProfile}
              onDelete={handlePostDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
