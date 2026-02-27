import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Textarea } from '../components/Textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../components/Avatar'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { Camera, UserPlus, UserMinus } from 'lucide-react'
import PostCard from '../components/PostCard'

export default function Profile() {
  const { userId } = useParams()
  const { user, profile: currentProfile, updateProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchPosts()
  }, [userId])

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(data)
      setDisplayName(data.display_name)
      setBio(data.bio)
      setAvatarUrl(data.avatar_url)

      // Check if current user is following
      if (user && user.id !== userId) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .single()

        setIsFollowing(!!followData)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const postsWithCounts = data.map(post => ({
        ...post,
        likeCount: post.likes?.length || 0,
        commentCount: post.comments?.length || 0,
      }))

      setPosts(postsWithCounts)
    } catch (error) {
      console.error('Error fetching posts:', error)
    }
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        display_name: displayName,
        bio,
        avatar_url: avatarUrl,
      })
      setEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
  }

  const handleFollow = async () => {
    if (!user) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId)
        setIsFollowing(false)
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId,
          })
        setIsFollowing(true)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p.id !== postId))
  }

  const handlePostUpdated = (updatedPost) => {
    setPosts(posts.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Profile not found
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwnProfile = user?.id === userId

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && editing && (
                <Input
                  type="text"
                  placeholder="Avatar URL"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="mt-2 text-xs"
                />
              )}
            </div>
            <div className="flex-1">
              {editing ? (
                <div className="space-y-3">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name"
                  />
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Bio"
                    className="min-h-[80px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveProfile}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                    {isOwnProfile ? (
                      <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                        Edit Profile
                      </Button>
                    ) : user ? (
                      <Button
                        size="sm"
                        variant={isFollowing ? 'outline' : 'default'}
                        onClick={handleFollow}
                        disabled={followLoading}
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-1" />
                            Unfollow
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Follow
                          </>
                        )}
                      </Button>
                    ) : null}
                  </div>
                  {profile.bio && (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posts ({posts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No posts yet
            </p>
          ) : (
            <div className="space-y-4">
              {posts.map(post => (
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
        </CardContent>
      </Card>
    </div>
  )
}
