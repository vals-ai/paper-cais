import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera, Pencil, UserPlus, UserMinus, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { timeAgo } from '../lib/helpers';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import LoadingSpinner from '../components/LoadingSpinner';

export default function ProfilePage() {
  const { username } = useParams();
  const { user, profile: authProfile, updateProfile } = useAuth();
  const navigate = useNavigate();
  
  const [profileData, setProfileData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', bio: '', username: '' });
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState('');

  const isOwnProfile = user && profileData && user.id === profileData.id;

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    // Try username first, then id
    let { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (!data) {
      const { data: dataById } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', username)
        .maybeSingle();
      data = dataById;
    }

    if (!data) {
      setLoading(false);
      return;
    }

    setProfileData(data);
    setEditForm({
      display_name: data.display_name || '',
      bio: data.bio || '',
      username: data.username || '',
    });

    // Fetch posts
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, profiles:user_id(id, display_name, username, avatar_url)')
      .eq('user_id', data.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setPosts(postsData || []);

    // Fetch follow counts
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', data.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', data.id),
    ]);
    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);

    // Check follow status
    if (user && user.id !== data.id) {
      const { data: followData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', data.id)
        .maybeSingle();
      setIsFollowing(!!followData);
    }

    setLoading(false);
  }, [username, user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const toggleFollow = async () => {
    if (!user || !profileData) return;
    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profileData.id);
      setIsFollowing(false);
      setFollowerCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: profileData.id,
      });
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
      await supabase.from('notifications').insert({
        user_id: profileData.id,
        actor_id: user.id,
        type: 'follow',
      });
    }
  };

  const handleSaveProfile = async () => {
    setSaveError('');
    if (!editForm.display_name.trim()) {
      setSaveError('Display name is required');
      return;
    }
    if (!editForm.username.trim()) {
      setSaveError('Username is required');
      return;
    }
    try {
      const updated = await updateProfile({
        display_name: editForm.display_name.trim(),
        bio: editForm.bio.trim(),
        username: editForm.username.trim().toLowerCase(),
      });
      setProfileData(updated);
      setEditing(false);
      // Navigate to the new username if it changed
      if (updated.username !== username) {
        navigate(`/profile/${updated.username}`, { replace: true });
      }
    } catch (err) {
      setSaveError(err.message || 'Failed to update profile');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      try {
        const updated = await updateProfile({ avatar_url: path });
        setProfileData(updated);
      } catch (err) {
        console.error('Failed to update avatar', err);
      }
    }
    setUploading(false);
  };

  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
    );
  };

  if (loading) return <LoadingSpinner text="Loading profile..." />;

  if (!profileData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-12 text-center">
          <p className="text-muted-foreground text-lg">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="relative group">
            <Avatar src={profileData.avatar_url} size="xl" />
            {isOwnProfile && (
              <label className="absolute inset-0 flex items-center justify-center bg-foreground/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <Camera className="w-6 h-6 text-primary-foreground" />
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
                {saveError && (
                  <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-2 border border-destructive/20">
                    {saveError}
                  </div>
                )}
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Display Name</label>
                  <input
                    type="text"
                    value={editForm.display_name}
                    onChange={(e) => setEditForm((f) => ({ ...f, display_name: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Username</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm((f) => ({ ...f, username: e.target.value }))}
                    className="input-field text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm((f) => ({ ...f, bio: e.target.value }))}
                    className="input-field text-sm resize-none"
                    rows={3}
                    maxLength={200}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} className="btn-primary text-sm">
                    Save
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-ghost text-sm">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold text-foreground">
                    {profileData.display_name || 'Unknown'}
                  </h1>
                  {isOwnProfile && (
                    <button
                      onClick={() => setEditing(true)}
                      className="btn-ghost text-sm py-1 px-2"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-muted-foreground text-sm">@{profileData.username}</p>
                {profileData.bio && (
                  <p className="text-foreground text-sm mt-2">{profileData.bio}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">Joined {timeAgo(profileData.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm">
                    <strong className="text-foreground">{followingCount}</strong>{' '}
                    <span className="text-muted-foreground">Following</span>
                  </span>
                  <span className="text-sm">
                    <strong className="text-foreground">{followerCount}</strong>{' '}
                    <span className="text-muted-foreground">Followers</span>
                  </span>
                </div>
              </>
            )}
          </div>

          {!isOwnProfile && user && (
            <button
              onClick={toggleFollow}
              className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-medium transition-all ${
                isFollowing ? 'btn-outline' : 'btn-primary'
              }`}
            >
              {isFollowing ? (
                <>
                  <UserMinus className="w-4 h-4" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Follow
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Posts */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Posts ({posts.length})
        </h2>
        {posts.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-muted-foreground">No posts yet</p>
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
    </div>
  );
}
