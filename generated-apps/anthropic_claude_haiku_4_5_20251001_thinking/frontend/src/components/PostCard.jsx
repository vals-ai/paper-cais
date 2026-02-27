import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { formatDate } from '../lib/utils'
import * as styles from '../lib/styles'

export const PostCard = ({ post, onLikeChange }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [author, setAuthor] = useState(null)
  const [liked, setLiked] = useState(false)
  const [loadingLike, setLoadingLike] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  // Fetch post author
  useEffect(() => {
    const fetchAuthor = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', post.user_id)
        .single()
      setAuthor(data)
    }
    fetchAuthor()
  }, [post.user_id])

  // Check if user liked this post
  useEffect(() => {
    if (!user) return

    const checkLike = async () => {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', post.id)
        .eq('user_id', user.id)
        .single()
      setLiked(!!data)
    }
    checkLike()
  }, [user, post.id])

  // Load comments
  const loadComments = async () => {
    if (showComments) {
      setShowComments(false)
      return
    }

    setLoadingComments(true)
    try {
      const { data } = await supabase
        .from('comments')
        .select(`
          *,
          user_profiles:user_id (*)
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
      
      setComments(data || [])
      setShowComments(true)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleLike = async () => {
    if (!user) {
      navigate('/login')
      return
    }

    setLoadingLike(true)
    try {
      if (liked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id)
        setLiked(false)
      } else {
        await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: user.id,
          })
        setLiked(true)

        // Create notification for post author
        if (post.user_id !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: post.user_id,
              actor_id: user.id,
              type: 'like',
              post_id: post.id,
            })
        }
      }
      onLikeChange?.()
    } finally {
      setLoadingLike(false)
    }
  }

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return

    try {
      const { data } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: newComment,
        })
        .select()
        .single()

      // Create notification for post author
      if (post.user_id !== user.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: 'comment',
            post_id: post.id,
            comment_id: data.id,
          })
      }

      setNewComment('')
      await loadComments()
      onLikeChange?.() // Refresh post counts
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const canEdit = user?.id === post.user_id
  const canDelete = user?.id === post.user_id

  return (
    <article className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 mb-4">
      {/* Post Header */}
      <div className="flex gap-4 mb-3">
        {author?.avatar_url && (
          <img
            src={author.avatar_url}
            alt={author.display_name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1">
          <button
            onClick={() => navigate(`/profile/${post.user_id}`)}
            className="group flex items-center gap-1 hover:opacity-80 transition-opacity"
          >
            <span className="font-bold text-neutral-900 group-hover:text-primary-600">
              {author?.display_name}
            </span>
            <span className="text-neutral-500">@{author?.email?.split('@')[0]}</span>
          </button>
          <p className="text-xs text-neutral-500">
            {formatDate(post.created_at)}
          </p>
        </div>
        {canDelete && (
          <button
            onClick={async () => {
              await supabase.from('posts').delete().eq('id', post.id)
              onLikeChange?.()
            }}
            className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-medium bg-transparent text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 transition-all duration-200 cursor-pointer"
          >
            Delete
          </button>
        )}
      </div>

      {/* Post Content */}
      <p className="text-neutral-900 mb-4 break-words whitespace-pre-wrap">
        {post.content}
      </p>

      {/* Post Actions */}
      <div className="flex gap-8 pt-4 border-t border-neutral-200 text-neutral-500">
        <button
          onClick={loadComments}
          disabled={loadingComments}
          className="group flex items-center gap-2 hover:text-primary-600 transition-colors cursor-pointer text-sm"
        >
          <span className="group-hover:bg-primary-100 p-2 rounded-full transition-colors">💬</span>
          <span>{post.comments_count || 0}</span>
        </button>
        <button
          onClick={handleLike}
          disabled={loadingLike}
          className={`group flex items-center gap-2 transition-colors cursor-pointer text-sm ${
            liked ? 'text-accent-600' : 'hover:text-accent-600 text-neutral-500'
          }`}
        >
          <span className={`group-hover:bg-accent-100 p-2 rounded-full transition-colors ${
            liked ? 'text-accent-600' : ''
          }`}>
            {liked ? '❤️' : '🤍'}
          </span>
          <span>{post.likes_count || 0}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          {/* Add Comment */}
          {user && (
            <div className="flex gap-3 mb-4 pb-4 border-b border-neutral-200">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="What do you think?"
                className="input flex-1 py-2 text-sm"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 transition-all duration-200 cursor-pointer"
              >
                Reply
              </button>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 text-sm">
                {comment.user_profiles?.avatar_url && (
                  <img
                    src={comment.user_profiles.avatar_url}
                    alt={comment.user_profiles.display_name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 bg-neutral-50 rounded p-3">
                  <button
                    onClick={() => navigate(`/profile/${comment.user_id}`)}
                    className="font-bold text-neutral-900 hover:text-primary-600 text-sm"
                  >
                    {comment.user_profiles?.display_name}
                  </button>
                  <p className="text-neutral-600 mt-1 break-words whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {formatDate(comment.created_at)}
                  </p>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={async () => {
                      await supabase.from('comments').delete().eq('id', comment.id)
                      await loadComments()
                    }}
                    className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-medium bg-transparent text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 transition-all duration-200 cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
