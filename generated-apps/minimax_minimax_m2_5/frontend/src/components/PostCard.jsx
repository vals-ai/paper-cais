import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const [likes, setLikes] = useState(post.likes?.[0]?.count || 0);
  const [comments, setComments] = useState(post.comments?.[0]?.count || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentsList, setCommentsList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    checkIfLiked();
  }, [post.id, user]);

  const checkIfLiked = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('likes')
      .select('*')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .single();
    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        setLikes(likes - 1);
      } else {
        await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: user.id
          });
        
        // Create notification
        if (post.author_id !== user.id) {
          await supabase
            .from('notifications')
            .insert({
              user_id: post.author_id,
              type: 'like',
              from_user_id: user.id,
              post_id: post.id
            });
        }
        setLikes(likes + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .eq('post_id', post.id)
        .order('created_at', { ascending: true });
      setCommentsList(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleShowComments = () => {
    if (!showComments) {
      fetchComments();
    }
    setShowComments(!showComments);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: commentText.trim(),
          post_id: post.id,
          author_id: user.id
        })
        .select(`
          *,
          profiles:author_id (
            id,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      setCommentsList([...commentsList, data]);
      setComments(comments + 1);
      setCommentText('');

      // Create notification
      if (post.author_id !== user.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: post.author_id,
            type: 'comment',
            from_user_id: user.id,
            post_id: post.id
          });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
      onUpdate();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim() || editContent.length > 280) return;

    try {
      await supabase
        .from('posts')
        .update({ content: editContent.trim() })
        .eq('id', post.id);
      post.content = editContent.trim();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const isAuthor = user?.id === post.author_id;

  return (
    <div className="bg-white rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex gap-4">
        {/* Avatar */}
        <Link to={`/profile/${post.profiles?.id}`} className="flex-shrink-0">
          {post.profiles?.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt={post.profiles.display_name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-background-tertiary flex items-center justify-center">
              <svg className="w-6 h-6 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/profile/${post.profiles?.id}`} className="font-medium text-foreground hover:underline">
              {post.profiles?.display_name || 'Unknown'}
            </Link>
            <span className="text-foreground-muted text-sm">@{post.profiles?.id?.slice(0, 8)}</span>
            <span className="text-foreground-muted text-sm">·</span>
            <span className="text-foreground-muted text-sm">{formatDate(post.created_at)}</span>
            {isAuthor && (
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-foreground-muted hover:text-primary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={handleDelete}
                  className="text-foreground-muted hover:text-error transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          {isEditing ? (
            <div className="mb-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                maxLength={280}
                className="w-full px-3 py-2 bg-background-secondary border border-border rounded-lg text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-sm text-foreground-secondary hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={!editContent.trim() || editContent.length > 280}
                  className="px-3 py-1 text-sm bg-primary text-white rounded-lg disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-foreground mb-3 whitespace-pre-wrap">{post.content}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 text-foreground-muted">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 hover transition-colors ${
                isLiked ? 'text-error' : 'hover:text-error'
              }`}
            >
              <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{likes}</span>
            </button>

            <button
              onClick={handleShowComments}
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{comments}</span>
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-4 pt-4 border-t border-border">
              {/* Comment Form */}
              <form onSubmit={handleComment} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    maxLength={280}
                    className="flex-1 px-3 py-2 bg-background-secondary border border-border rounded-lg text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-primary-hover transition-colors"
                  >
                    Post
                  </button>
                </div>
              </form>

              {/* Comments List */}
              {loadingComments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent mx-auto" />
                </div>
              ) : commentsList.length === 0 ? (
                <p className="text-center text-foreground-muted py-4">No comments yet</p>
              ) : (
                <div className="space-y-3">
                  {commentsList.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Link to={`/profile/${comment.profiles?.id}`}>
                        {comment.profiles?.avatar_url ? (
                          <img
                            src={comment.profiles.avatar_url}
                            alt={comment.profiles.display_name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-background-tertiary flex items-center justify-center">
                            <svg className="w-4 h-4 text-foreground-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 bg-background-secondary rounded-lg px-3 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Link to={`/profile/${comment.profiles?.id}`} className="font-medium text-sm text-foreground hover:underline">
                            {comment.profiles?.display_name || 'Unknown'}
                          </Link>
                          <span className="text-xs text-foreground-muted">{formatDate(comment.created_at)}</span>
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
