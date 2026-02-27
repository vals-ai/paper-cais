import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Pencil, Trash2, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { cn, formatDate } from '../lib/utils';
import Avatar from './Avatar';

export default function PostCard({ post, onUpdate, onDelete }) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const isOwner = user?.id === post.user_id;
  const isLiked = post.user_liked;
  const likeCount = post.like_count || 0;
  const commentCount = post.comment_count || 0;

  const handleLike = async () => {
    if (!user || likeLoading) return;
    setLikeLoading(true);
    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);
      } else {
        await supabase.from('likes').insert({ user_id: user.id, post_id: post.id });
        // Create notification for post author (if not self)
        if (post.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: 'like',
            post_id: post.id,
          });
        }
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Like error:', err);
    }
    setLikeLoading(false);
  };

  const handleEdit = async () => {
    if (!editContent.trim() || editContent.length > 280) return;
    const { error } = await supabase
      .from('posts')
      .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
      .eq('id', post.id);
    if (!error) {
      setIsEditing(false);
      if (onUpdate) onUpdate();
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (!error && onDelete) onDelete(post.id);
  };

  const loadComments = async () => {
    setCommentsLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('*, profiles:user_id(username, display_name, avatar_url)')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true });
    setComments(data || []);
    setCommentsLoading(false);
  };

  const toggleComments = async () => {
    if (!showComments) {
      await loadComments();
    }
    setShowComments(!showComments);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    const { error } = await supabase.from('comments').insert({
      user_id: user.id,
      post_id: post.id,
      content: commentText.trim(),
    });
    if (!error) {
      // Create notification for post author
      if (post.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: 'comment',
          post_id: post.id,
        });
      }
      setCommentText('');
      await loadComments();
      if (onUpdate) onUpdate();
    }
  };

  const profileData = post.profiles || {};

  return (
    <div className="card animate-fade-in p-4">
      <div className="flex gap-3">
        <Link to={`/profile/${profileData.username}`}>
          <Avatar
            src={profileData.avatar_url}
            name={profileData.display_name || profileData.username}
            size="md"
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              to={`/profile/${profileData.username}`}
              className="font-semibold text-foreground hover:text-primary transition-colors truncate"
            >
              {profileData.display_name || profileData.username}
            </Link>
            <span className="text-muted-foreground text-sm">@{profileData.username}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm whitespace-nowrap">{formatDate(post.created_at)}</span>
            {post.updated_at && post.created_at && 
              Math.abs(new Date(post.updated_at) - new Date(post.created_at)) > 5000 && (
              <span className="text-muted-foreground text-xs italic">(edited)</span>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="input-field min-h-[80px] resize-none"
                maxLength={280}
              />
              <div className="flex items-center justify-between mt-2">
                <span className={cn('text-xs', editContent.length > 260 ? 'text-destructive' : 'text-muted-foreground')}>
                  {editContent.length}/280
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setIsEditing(false)} className="btn-ghost text-sm py-1 px-2">
                    <X className="h-4 w-4" />
                  </button>
                  <button onClick={handleEdit} className="btn-primary text-sm py-1 px-2">
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-foreground whitespace-pre-wrap break-words">{post.content}</p>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-4">
            {user && (
              <button
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-1.5 text-sm transition-colors',
                  isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                )}
                disabled={likeLoading}
              >
                <Heart className={cn('h-4 w-4', isLiked && 'fill-current animate-pulse-once')} />
                <span>{likeCount}</span>
              </button>
            )}
            {!user && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Heart className="h-4 w-4" />
                <span>{likeCount}</span>
              </span>
            )}

            <button
              onClick={toggleComments}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span>{commentCount}</span>
            </button>

            {isOwner && !isEditing && (
              <>
                <button
                  onClick={() => { setIsEditing(true); setEditContent(post.content); }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors ml-auto"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {/* Comments section */}
          {showComments && (
            <div className="mt-4 border-t border-border pt-4 space-y-3">
              {commentsLoading ? (
                <div className="space-y-2">
                  <div className="skeleton h-10 w-full" />
                  <div className="skeleton h-10 w-3/4" />
                </div>
              ) : (
                <>
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Link to={`/profile/${comment.profiles?.username}`}>
                        <Avatar
                          src={comment.profiles?.avatar_url}
                          name={comment.profiles?.display_name || comment.profiles?.username}
                          size="sm"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/profile/${comment.profiles?.username}`}
                            className="font-semibold text-sm text-foreground hover:text-primary transition-colors"
                          >
                            {comment.profiles?.display_name || comment.profiles?.username}
                          </Link>
                          <span className="text-muted-foreground text-xs">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-sm text-foreground mt-0.5 break-words">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">No comments yet</p>
                  )}
                </>
              )}

              {user && (
                <form onSubmit={handleComment} className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="input-field flex-1"
                    maxLength={280}
                  />
                  <button
                    type="submit"
                    className="btn-primary text-sm"
                    disabled={!commentText.trim()}
                  >
                    Reply
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
