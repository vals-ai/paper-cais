import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PostCard } from '../components/PostCard'

export const Profile = () => {
  const navigate = useNavigate()
  const { userId } = useParams()
  const { user: currentUser, profile: currentProfile } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [editingBio, setEditingBio] = useState(false)
  const [newBio, setNewBio] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        // Load user profile
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileData) {
          setProfile(profileData)
          setNewBio(profileData.bio || '')

          // Load user's posts
          const { data: postsData } = await supabase
            .from('posts')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

          setPosts(postsData || [])

          // Check if following
          if (currentUser?.id !== userId) {
            const { data: followData } = await supabase
              .from('follows')
              .select('id')
              .eq('follower_id', currentUser?.id)
              .eq('following_id', userId)
              .single()

            setFollowing(!!followData)
          }

          // Load follower count
          const { count: followers } = await supabase
            .from('follows')
            .select('*', { count: 'exact' })
            .eq('following_id', userId)

          setFollowerCount(followers || 0)

          // Load following count
          const { count: following } = await supabase
            .from('follows')
            .select('*', { count: 'exact' })
            .eq('follower_id', userId)

          setFollowingCount(following || 0)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [userId, currentUser?.id])

  const handleFollow = async () => {
    if (!currentUser) {
      navigate('/login')
      return
    }

    try {
      if (following) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', userId)

        setFollowing(false)
        setFollowerCount(Math.max(0, followerCount - 1))
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: userId,
          })

        setFollowing(true)
        setFollowerCount(followerCount + 1)

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            actor_id: currentUser.id,
            type: 'follow',
          })
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    }
  }

  const handleSaveBio = async () => {
    if (!currentUser || currentUser.id !== userId) return

    try {
      await supabase
        .from('user_profiles')
        .update({ bio: newBio })
        .eq('id', userId)

      setProfile({ ...profile, bio: newBio })
      setEditingBio(false)
    } catch (error) {
      console.error('Error updating bio:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 p-8 animate-pulse">
            <div className="h-32 bg-neutral-200 rounded mb-4"></div>
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-neutral-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 p-8 text-center">
            <p className="text-neutral-500">User not found</p>
          </div>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === userId

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 mb-6 p-6">
          <div className="flex gap-6">
            {/* Avatar */}
            <div>
              {profile.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-neutral-900">
                    {profile.display_name}
                  </h1>
                  <p className="text-neutral-500">@{profile.email?.split('@')[0]}</p>
                </div>

                {!isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    className={following ? 'btn-secondary py-2' : 'btn-primary py-2'}
                  >
                    {following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Bio */}
              {isOwnProfile && editingBio ? (
                <div className="space-y-3">
                  <textarea
                    value={newBio}
                    onChange={(e) => setNewBio(e.target.value)}
                    placeholder="Tell us about yourself"
                    className="w-full px-4 py-2 rounded-lg border border-neutral-300 text-neutral-900 placeholder-neutral-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed resize-none"
                    rows="3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveBio}
                      className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 transition-all duration-200 cursor-pointer"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingBio(false)
                        setNewBio(profile.bio || '')
                      }}
                      className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-medium bg-neutral-200 text-neutral-900 hover:bg-neutral-300 active:bg-neutral-400 transition-all duration-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => isOwnProfile && setEditingBio(true)}
                  className={`text-neutral-600 ${isOwnProfile ? 'cursor-pointer hover:bg-neutral-100 p-2 rounded' : ''}`}
                >
                  {profile.bio || (isOwnProfile ? 'Add a bio...' : 'No bio yet')}
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-6 mt-4 pt-4 border-t border-neutral-200">
                <button
                  onClick={() => {
                    navigate(`/profile/${userId}/following`)
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <span className="font-bold text-neutral-900">
                    {followingCount}
                  </span>
                  <span className="text-neutral-500 text-sm"> Following</span>
                </button>
                <button
                  onClick={() => {
                    navigate(`/profile/${userId}/followers`)
                  }}
                  className="hover:opacity-80 transition-opacity"
                >
                  <span className="font-bold text-neutral-900">
                    {followerCount}
                  </span>
                  <span className="text-neutral-500 text-sm"> Followers</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 px-0">
            Posts
          </h2>
          {posts.length === 0 ? (
            <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 p-8 text-center">
              <p className="text-neutral-500">
                {isOwnProfile ? 'You haven\'t posted yet' : 'No posts yet'}
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLikeChange={() => {
                  // Reload posts if needed
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
