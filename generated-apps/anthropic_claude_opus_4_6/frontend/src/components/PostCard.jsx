import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, MoreHorizontal, Pencil, Trash2, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { timeAgo, highlightHashtags } from '../lib/helpers';
import Avatar from './Avatar';
import CommentSection from './CommentSection';

export default function PostCard({ post, onDelete, onUpdate }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const menuRef = useRef(null);

  const isOwner = user?.id === post.user_id;
  const author = post.profiles || post.author;

  useEffect(() => {
    fetchCounts();
  }, [post.id]);

  useEffect(() => {
    if (!user) return;
    checkLiked();
  }, [user, post.id]);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchCounts = async () => {
    const [{ count: likes }, { count: comments }] = await Promise.all([
      supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('post_id', post.id),
    ]);
    setLikeCount(likes || 0);
    setCommentCount(comments || 0);
  };

  const checkLiked = async () => {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle();
    setLiked(!!data);
  };

  const toggleLike = async () => {
    if (!user) return;
    if (liked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
      setLiked(true);
      setLikeCount((c) => c + 1);
      // Create notification
      if (post.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: post.user_id,
          actor_id: user.id,
          type: 'like',
          post_id: post.id,
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    await supabase.from('posts').delete().eq('id', post.id);
    onDelete?.(post.id);
    setShowMenu(false);
  };

  const handleEdit = async () => {
    if (editContent.trim().length === 0 || editContent.length > 280) return;
    const { data } = await supabase
      .from('posts')
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq('id', post.id)
      .select()
      .single();
    if (data) {
      onUpdate?.(data);
      setEditing(false);
    }
  };

  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex gap-3">
        <Link to={`/profile/${author?.username || post.user_id}`}>
          <Avatar src={author?.avatar_url} size="md" />
        </Link>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                to={`/profile/${author?.username || post.user_id}`}
                className="font-semibold text-foreground hover:underline truncate"
              >
                {author?.display_name || 'Unknown'}
              </Link>
              <span className="text-muted-foreground text-sm truncate">
                @{author?.username || 'unknown'}
              </span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                {timeAgo(post.created_at)}
              </span>
            </div>

            {isOwner && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-full text-muted-foreground hover:bg-secondary transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-lg py-1 z-10 w-36">
                    <button
                      onClick={() => { setEditing(true); setShowMenu(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary flex items-center gap-2 text-foreground"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-secondary flex items-center gap-2 text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {editing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="input-field text-sm resize-none"
                rows={3}
                maxLength={280}
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-xs ${editContent.length > 260 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {editContent.length}/280
                </span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(false); setEditContent(post.content); }} className="btn-ghost text-sm py-1 px-3">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={handleEdit} className="btn-primary text-sm py-1 px-3" disabled={editContent.trim().length === 0}>
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p
              className="mt-1 text-foreground text-sm leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: highlightHashtags(post.content) }}
            />
          )}

          {post.updated_at && post.updated_at !== post.created_at && !editing && (
            <span className="text-xs text-muted-foreground mt-1 inline-block">(edited)</span>
          )}

          <div className="flex items-center gap-6 mt-3">
            <button
              onClick={toggleLike}
              disabled={!user}
              className={`flex items-center gap-1.5 text-sm transition-colors group
                ${liked ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
            >
              <Heart className={`w-4 h-4 transition-transform group-hover:scale-110 ${liked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              <MessageCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>{commentCount}</span>
            </button>
          </div>

          {showComments && (
            <CommentSection
              postId={post.id}
              postOwnerId={post.user_id}
              onCommentCountChange={(count) => setCommentCount(count)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
