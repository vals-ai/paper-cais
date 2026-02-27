import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import Avatar from '../components/Avatar'
import Button from '../components/Button'
import PostCard from '../components/PostCard'
import Loader from '../components/Loader'
import EmptyState from '../components/EmptyState'

const ProfilePage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [stats, setStats] = useState({ followers: 0, following: 0 })
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadProfile = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single()

      if (profileError) {
        setProfile(null)
        setErrorMessage('Unable to load this profile right now.')
        return
      }

      setProfile(profileData)

      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(
          'id, content, created_at, updated_at, author_id, profiles:author_id(id, display_name, avatar_url), likes(count), comments(count)'
        )
        .eq('author_id', id)
        .order('created_at', { ascending: false })

      if (postError) {
        setPosts([])
        setErrorMessage('Unable to load posts for this profile right now.')
      }

      const postIds = postData?.map((post) => post.id) ?? []
      let likedPostIds = []

      if (user && postIds.length) {
        const { data: likesData } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds)

        likedPostIds = likesData?.map((like) => like.post_id) ?? []
      }

      const mappedPosts = (postData ?? []).map((post) => ({
        ...post,
        author: post.profiles,
        likeCount: post.likes?.[0]?.count ?? 0,
        commentCount: post.comments?.[0]?.count ?? 0,
        isLiked: likedPostIds.includes(post.id)
      }))

      setPosts(mappedPosts)

      const { count: followerCount } = await supabase
        .from('follows')
        .select('follower_id', { count: 'exact', head: true })
        .eq('following_id', id)

      const { count: followingCount } = await supabase
        .from('follows')
        .select('following_id', { count: 'exact', head: true })
        .eq('follower_id', id)

      setStats({ followers: followerCount || 0, following: followingCount || 0 })

      if (user && user.id !== id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .eq('following_id', id)
          .maybeSingle()
        setIsFollowing(Boolean(followData))
      }
    } catch (error) {
      setErrorMessage('Unable to load this profile right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [id, user?.id])

  const handleLikeToggle = async (post) => {
    if (!user) return
    setErrorMessage('')
    if (post.isLiked) {
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', post.id)
        .eq('user_id', user.id)
      if (error) {
        setErrorMessage('Unable to remove your like right now.')
        return
      }
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id
            ? { ...item, isLiked: false, likeCount: Math.max(item.likeCount - 1, 0) }
            : item
        )
      )
    } else {
      const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: user.id })
      if (error) {
        setErrorMessage('Unable to like this post right now.')
        return
      }
      setPosts((prev) =>
        prev.map((item) =>
          item.id === post.id ? { ...item, isLiked: true, likeCount: item.likeCount + 1 } : item
        )
      )
    }
  }

  const handleDeletePost = async (postId) => {
    setErrorMessage('')
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) {
      setErrorMessage('Unable to delete this post right now.')
      return
    }
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  const handleUpdatePost = async (postId, content) => {
    setErrorMessage('')
    const { error } = await supabase.from('posts').update({ content }).eq('id', postId)
    if (error) {
      setErrorMessage('Unable to update this post right now.')
      return
    }
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, content } : post)))
  }

  const handleCommentAdded = (postId) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, commentCount: post.commentCount + 1 } : post
      )
    )
  }

  const handleFollowToggle = async () => {
    if (!user || user.id === id) return
    setErrorMessage('')
    if (isFollowing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', id)
      if (error) {
        setErrorMessage('Unable to update your follow right now.')
        return
      }
      setIsFollowing(false)
      setStats((prev) => ({ ...prev, followers: Math.max(prev.followers - 1, 0) }))
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: id })
      if (error) {
        setErrorMessage('Unable to follow this member right now.')
        return
      }
      setIsFollowing(true)
      setStats((prev) => ({ ...prev, followers: prev.followers + 1 }))
    }
  }

  if (loading) {
    return (
      <div className="app-container py-12">
        <Loader label="Loading profile" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="app-container py-12">
        <EmptyState title="Profile not found" description="We couldn't find that member." />
      </div>
    )
  }

  return (
    <div className="app-container py-10">
      <div className="surface-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar src={profile.avatar_url} name={profile.display_name || 'Member'} size="lg" />
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {profile.display_name || 'Member'}
              </h1>
              <p className="text-sm text-muted-foreground">{profile.bio || 'No bio yet.'}</p>
            </div>
          </div>
          {user && user.id !== id && (
            <Button variant={isFollowing ? 'muted' : 'secondary'} onClick={handleFollowToggle}>
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-6">
          <div>
            <p className="text-sm text-muted-foreground">Followers</p>
            <p className="text-xl font-semibold text-foreground">{stats.followers}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Following</p>
            <p className="text-xl font-semibold text-foreground">{stats.following}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Posts</p>
            <p className="text-xl font-semibold text-foreground">{posts.length}</p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-6 surface-muted px-4 py-3 text-sm text-warning">
          {errorMessage}
        </div>
      )}

      <div className="mt-8 max-h-[70vh] space-y-6 overflow-y-auto pr-2">
        {posts.length ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={user}
              onLikeToggle={handleLikeToggle}
              onDelete={handleDeletePost}
              onUpdate={handleUpdatePost}
              onCommentAdded={handleCommentAdded}
            />
          ))
        ) : (
          <EmptyState title="No posts yet" description="This member hasn't shared an update yet." />
        )}
      </div>
    </div>
  )
}

export default ProfilePage
