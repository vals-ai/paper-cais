import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import Avatar from './Avatar'

export default function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [showMenu, setShowMenu] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [likesLoading, setLikesLoading] = useState(false)

  const profile = post.profiles
  const likes = post.likes || []
  const commentCount = post.comments?.length || 0
  const isLiked = user ? likes.some(l => l.user_id === user.id) : false
  const isOwner = user?.id === post.user_id

  // Parse hashtags from content
  const renderContent = (content) => {
    const parts = content.split(/(#\w+)/g)
    return parts.map((part, i) =>
      part.startsWith('#') ? (
        <Link
          key={i}
          to={`/search?q=${encodeURIComponent(part)}`}
          className="text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      ) : part
    )
  }

  const handleLike = async () => {
    if (!user || likesLoading) return
    setLikesLoading(true)
    try {
      if (isLiked) {
        await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id)
        onUpdate?.(post.id, { likes: likes.filter(l => l.user_id !== user.id) })
      } else {
        const { data } = await supabase.from('likes').insert({ post_id: post.id, user_id: user.id }).select().single()
        onUpdate?.(post.id, { likes: [...likes, data] })
      }
    } catch (err) {
      console.error('Like error:', err)
    } finally {
      setLikesLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim() || editContent.length > 280) return
    setSavingEdit(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({ content: editContent, updated_at: new Date().toISOString() })
        .eq('id', post.id)
        .select(`*, profiles!posts_user_id_fkey (id, username, display_name, avatar_url), likes (id, user_id), comments (id)`)
        .single()
      if (error) throw error
      onUpdate?.(post.id, { content: data.content, updated_at: data.updated_at })
      setIsEditing(false)
    } catch (err) {
      console.error('Edit error:', err)
    } finally {
      setSavingEdit(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    try {
      await supabase.from('posts').delete().eq('id', post.id)
      onDelete?.(post.id)
    } catch (err) {
      console.error('Delete error:', err)
    }
  }

  const loadComments = async () => {
    if (showComments) {
      setShowComments(false)
      return
    }
    setShowComments(true)
    setLoadingComments(true)
    try {
      const { data } = await supabase
        .from('comments')
        .select(`*, profiles!comments_user_id_fkey (id, username, display_name, avatar_url)`)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })
      setComments(data || [])
    } catch (err) {
      console.error('Comments error:', err)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !user) return
    try {
      const { data } = await supabase
        .from('comments')
        .insert({ post_id: post.id, user_id: user.id, content: commentText })
        .select(`*, profiles!comments_user_id_fkey (id, username, display_name, avatar_url)`)
        .single()
      setComments(prev => [...prev, data])
      setCommentText('')
      onUpdate?.(post.id, { comments: [...(post.comments || []), { id: data.id }] })
    } catch (err) {
      console.error('Comment error:', err)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await supabase.from('comments').delete().eq('id', commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
      onUpdate?.(post.id, { comments: (post.comments || []).filter(c => c.id !== commentId) })
    } catch (err) {
      console.error('Delete comment error:', err)
    }
  }

  return (
    <article className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <Link to={`/profile/${profile?.username}`}>
          <Avatar src={profile?.avatar_url} size="md" />
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link to={`/profile/${profile?.username}`} className="font-semibold text-foreground hover:underline">
                {profile?.display_name || profile?.username}
              </Link>
              <span className="text-muted-foreground text-sm ml-2">@{profile?.username}</span>
              <span className="text-muted-foreground text-sm mx-2">·</span>
              <span className="text-muted-foreground text-xs" title={new Date(post.created_at).toLocaleString()}>
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                {post.updated_at !== post.created_at && <span className="ml-1 text-xs">(edited)</span>}
              </span>
            </div>
            {isOwner && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-popover border border-border rounded-md shadow-lg z-10 py-1 min-w-[120px]">
                    <button
                      onClick={() => { setIsEditing(true); setShowMenu(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => { handleDelete(); setShowMenu(false) }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                maxLength={280}
                rows={3}
                className="textarea w-full text-sm"
                autoFocus
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${editContent.length > 260 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {editContent.length}/280
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setIsEditing(false); setEditContent(post.content) }}
                    className="btn-outline btn-sm btn"
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={savingEdit || !editContent.trim() || editContent.length > 280}
                    className="btn-primary btn-sm btn"
                  >
                    <Check size={14} />
                    {savingEdit ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
              {renderContent(post.content)}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={handleLike}
                disabled={!user}
                className={`flex items-center gap-1.5 text-sm transition-colors ${
                  isLiked
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-muted-foreground hover:text-red-500'
                } disabled:cursor-default`}
              >
                <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
                <span>{likes.length}</span>
              </button>

              <button
                onClick={loadComments}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle size={16} />
                <span>{commentCount}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 border-t border-border pt-4 pl-13">
          {loadingComments ? (
            <div className="space-y-3">
              {[1,2].map(i => (
                <div key={i} className="flex gap-2 animate-pulse">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-24 rounded" />
                    <div className="skeleton h-3 w-full rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-2 group">
                  <Link to={`/profile/${comment.profiles?.username}`}>
                    <Avatar src={comment.profiles?.avatar_url} size="xs" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link to={`/profile/${comment.profiles?.username}`} className="text-xs font-semibold text-foreground hover:underline">
                          {comment.profiles?.display_name || comment.profiles?.username}
                        </Link>
                        <span className="text-muted-foreground text-xs ml-2">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {user?.id === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-red-500 transition-all"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-foreground mt-0.5 break-words">{comment.content}</p>
                  </div>
                </div>
              ))}

              {user && (
                <form onSubmit={handleComment} className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Add a comment…"
                    maxLength={500}
                    className="input flex-1 text-xs py-1.5"
                  />
                  <button type="submit" disabled={!commentText.trim()} className="btn-primary btn-sm btn">
                    Post
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* Close menu on outside click */}
      {showMenu && (
        <div className="fixed inset-0 z-[5]" onClick={() => setShowMenu(false)} />
      )}
    </article>
  )
}
