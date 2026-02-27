import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { timeAgo } from '../lib/helpers';
import Avatar from './Avatar';

export default function CommentSection({ postId, postOwnerId, onCommentCountChange }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('comments')
      .select('*, profiles:user_id(id, display_name, username, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    setComments(data || []);
    onCommentCountChange?.(data?.length || 0);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !content.trim() || submitting) return;
    setSubmitting(true);
    
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: user.id, content: content.trim() })
      .select('*, profiles:user_id(id, display_name, username, avatar_url)')
      .single();
    
    if (!error && data) {
      setComments((prev) => [...prev, data]);
      onCommentCountChange?.(comments.length + 1);
      setContent('');
      
      // Create notification
      if (postOwnerId !== user.id) {
        await supabase.from('notifications').insert({
          user_id: postOwnerId,
          actor_id: user.id,
          type: 'comment',
          post_id: postId,
        });
      }
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId) => {
    await supabase.from('comments').delete().eq('id', commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    onCommentCountChange?.(comments.length - 1);
  };

  return (
    <div className="mt-3 border-t border-border pt-3">
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="skeleton h-8 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 animate-fade-in">
              <Link to={`/profile/${comment.profiles?.username || comment.user_id}`}>
                <Avatar src={comment.profiles?.avatar_url} size="xs" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="bg-secondary rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/profile/${comment.profiles?.username || comment.user_id}`}
                      className="font-medium text-xs text-foreground hover:underline"
                    >
                      {comment.profiles?.display_name || 'Unknown'}
                    </Link>
                    <span className="text-xs text-muted-foreground">{timeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground mt-0.5 break-words">{comment.content}</p>
                </div>
              </div>
              {user?.id === comment.user_id && (
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="text-muted-foreground hover:text-destructive p-1 self-center transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">No comments yet</p>
          )}
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2 mt-3">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment..."
            className="input-field text-sm py-1.5"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="btn-primary py-1.5 px-3"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}
