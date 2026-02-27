import { useState, useEffect, useRef } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Camera, Pencil, Check, X, Link2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePosts } from '../hooks/usePosts'
import PostCard from '../components/PostCard'
import PostSkeleton from '../components/PostSkeleton'
import FollowButton from '../components/FollowButton'
import { formatDistanceToNow } from 'date-fns'

// Internal Avatar component for profile page
function ProfileAvatar({ src, isOwner, onUpload, uploading }) {
  const fileRef = useRef(null)

  return (
    <div className="relative group">
      <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary border-4 border-background shadow-md">
        {src ? (
          <img src={src} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Camera size={32} />
          </div>
        )}
      </div>
      {isOwner && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full flex items-center justify-center bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera size={20} className="text-background" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])}
          />
        </>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { username } = useParams()
  const { user, profile: currentProfile, updateProfile, refreshProfile } = useAuth()
  const { fetchUserPosts } = usePosts()

  const [profileData, setProfileData] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ display_name: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const isOwner = user && profileData && user.id === profileData.id

  useEffect(() => {
    loadProfile()
  }, [username])

  const loadProfile = async () => {
    setLoading(true)
    setNotFound(false)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (error || !data) {
        setNotFound(true)
        return
      }

      setProfileData(data)
      setEditForm({ display_name: data.display_name || '', bio: data.bio || '' })
      await Promise.all([loadPosts(data.id), loadFollowStats(data.id)])
    } finally {
      setLoading(false)
    }
  }

  const loadPosts = async (userId) => {
    setPostsLoading(true)
    try {
      const { data } = await fetchUserPosts(userId)
      setPosts(data || [])
    } finally {
      setPostsLoading(false)
    }
  }

  const loadFollowStats = async (userId) => {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    ])
    setFollowStats({ followers: followers || 0, following: following || 0 })
  }

  const handleAvatarUpload = async (file) => {
    if (!user || uploading) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      const { error } = await updateProfile({ avatar_url: publicUrl })
      if (!error) {
        setProfileData(prev => ({ ...prev, avatar_url: publicUrl }))
        await refreshProfile()
      }
    } catch (err) {
      console.error('Avatar upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const { error } = await updateProfile({
        display_name: editForm.display_name.trim(),
        bio: editForm.bio.trim(),
      })
      if (!error) {
        setProfileData(prev => ({
          ...prev,
          display_name: editForm.display_name.trim(),
          bio: editForm.bio.trim(),
        }))
        setIsEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePostUpdate = (postId, updates) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p))
  }

  const handlePostDelete = (postId) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  if (notFound) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-foreground mb-2">User not found</h2>
      <p className="text-muted-foreground">@{username} doesn't exist</p>
    </div>
  )

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="card p-8 animate-pulse space-y-4">
        <div className="flex items-end gap-4">
          <div className="skeleton w-24 h-24 rounded-full" />
          <div className="flex-1 space-y-2 pb-2">
            <div className="skeleton h-6 w-40 rounded" />
            <div className="skeleton h-4 w-24 rounded" />
          </div>
        </div>
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Profile card */}
      <div className="card overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-br from-brand-200 to-brand-500" />

        {/* Profile info */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-12 mb-4">
            <ProfileAvatar
              src={profileData?.avatar_url}
              isOwner={isOwner}
              onUpload={handleAvatarUpload}
              uploading={uploading}
            />
            <div className="flex gap-2 mb-1">
              {isOwner ? (
                isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="btn-outline btn-sm btn"
                    >
                      <X size={14} />
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="btn-primary btn-sm btn"
                    >
                      <Check size={14} className="mr-1" />
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="btn-outline btn-sm btn"
                  >
                    <Pencil size={14} className="mr-1.5" />
                    Edit profile
                  </button>
                )
              ) : (
                <FollowButton targetUserId={profileData?.id} />
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Display name</label>
                <input
                  type="text"
                  value={editForm.display_name}
                  onChange={e => setEditForm(f => ({ ...f, display_name: e.target.value }))}
                  maxLength={60}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  maxLength={200}
                  rows={3}
                  placeholder="Tell the world about yourself…"
                  className="textarea w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">{editForm.bio.length}/200</p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {profileData?.display_name || profileData?.username}
              </h1>
              <p className="text-muted-foreground text-sm">@{profileData?.username}</p>
              {profileData?.bio && (
                <p className="text-sm text-foreground mt-2">{profileData.bio}</p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Joined {formatDistanceToNow(new Date(profileData?.created_at), { addSuffix: true })}
              </p>
            </div>
          )}

          {/* Follow stats */}
          <div className="flex gap-6 mt-4 text-sm">
            <div>
              <span className="font-bold text-foreground">{followStats.following}</span>
              <span className="text-muted-foreground ml-1">Following</span>
            </div>
            <div>
              <span className="font-bold text-foreground">{followStats.followers}</span>
              <span className="text-muted-foreground ml-1">Followers</span>
            </div>
            <div>
              <span className="font-bold text-foreground">{posts.length}</span>
              <span className="text-muted-foreground ml-1">Posts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div>
        <h2 className="font-semibold text-foreground mb-3 px-1">Recent posts</h2>
        <div className="space-y-3">
          {postsLoading ? (
            Array(3).fill(0).map((_, i) => <PostSkeleton key={i} />)
          ) : posts.length === 0 ? (
            <div className="card p-12 text-center text-muted-foreground">
              <p>No posts yet</p>
            </div>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={handlePostUpdate}
                onDelete={handlePostDelete}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
