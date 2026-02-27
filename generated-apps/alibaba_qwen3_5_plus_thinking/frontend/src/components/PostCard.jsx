import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/Button'
import { Textarea } from '../components/Textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../components/Avatar'
import { Card, CardContent } from '../components/Card'
import { Heart, MessageCircle, Trash2, Edit2 } from 'lucide-react'

export default function PostCard({ post, currentUser, onDeleted, onUpdated, onInteraction }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [showComments, setShowComments] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [comments, setComments] = useState([])
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [loading, setLoading] = useState(false)

  const isOwner = currentUser?.id === post.user_id

  const handleLike = async () => {
    if (!currentUser) return

    setLoading(true)
    try {
      if (liked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', post.id)
        setLikeCount(prev => prev - 1)
      } else {
        await supabase
          .from('likes')
          .insert({
            user_id: currentUser.id,
            post_id: post.id,
          })
        setLikeCount(prev => prev + 1)
      }
      setLiked(!liked)
      onInteraction?.()
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return

    setLoading(true)
    try {
      await supabase
        .from('posts')
        .delete()
        .eq('id', post.id)
      onDeleted?.(post.id)
    } catch (error) {
      console.error('Error deleting post:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim() || editContent.length > 280) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
        .eq('id', post.id)
        .select()
        .single()

      if (error) throw error
      onUpdated?.(data)
      setEditing(false)
    } catch (error) {
      console.error('Error updating post:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setComments(data)
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleToggleComments = () => {
    if (!showComments) {
      fetchComments()
    }
    setShowComments(!showComments)
  }

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!commentContent.trim() || !currentUser) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          user_id: currentUser.id,
          post_id: post.id,
          content: commentContent.trim(),
        })
        .select(`
          *,
          profiles:user_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error
      setComments([...comments, data])
      setCommentContent('')
      onInteraction?.()
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Link to={`/profile/${post.profiles?.id}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles?.avatar_url} />
              <AvatarFallback>
                {post.profiles?.display_name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link
                  to={`/profile/${post.profiles?.id}`}
                  className="font-semibold hover:underline"
                >
                  {post.profiles?.display_name}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {formatDate(post.created_at)}
                </span>
              </div>
              {isOwner && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditing(!editing)}
                    disabled={loading}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>

            {editing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  maxLength={280}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleEdit} disabled={loading}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{post.content}</p>
            )}

            <div className="flex items-center gap-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={!currentUser || loading}
                className={liked ? 'text-red-500' : ''}
              >
                <Heart className={`h-4 w-4 mr-1 ${liked ? 'fill-current' : ''}`} />
                {likeCount}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleComments}
                disabled={!currentUser}
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                {post.commentCount}
              </Button>
            </div>

            {showComments && (
              <div className="space-y-3 pt-3 border-t">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-2">
                    <Link to={`/profile/${comment.profiles?.id}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.profiles?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {comment.profiles?.display_name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/profile/${comment.profiles?.id}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {comment.profiles?.display_name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
                {currentUser && (
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <Textarea
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      placeholder="Write a comment..."
                      className="min-h-[60px]"
                      maxLength={280}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      disabled={loading || !commentContent.trim()}
                    >
                      Post
                    </Button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
