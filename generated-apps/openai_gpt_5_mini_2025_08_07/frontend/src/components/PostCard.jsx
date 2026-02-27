import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function PostCard({ post, onAction }) {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    // fetch likes
    let mounted = true;
    (async () => {
      const { data: l } = await supabase.from('likes').select('*').eq('post_id', post.id);
      if (!mounted) return;
      setLikesCount(l?.length || 0);
      if (user) setLiked(l?.some(x => x.user_id === user.id));
    })();
    return () => { mounted = false; };
  }, [post.id, user]);

  const toggleLike = async () => {
    if (!user) return alert('Please log in to like');
    if (liked) {
      const { error } = await supabase.from('likes').delete().match({ post_id: post.id, user_id: user.id });
      if (error) return alert('Error unliking');
      setLiked(false);
      setLikesCount(c => Math.max(0, c - 1));
    } else {
      const { error } = await supabase.from('likes').insert([{ post_id: post.id, user_id: user.id }]);
      if (error) return alert('Error liking');
      setLiked(true);
      setLikesCount(c => c + 1);
      // create notification for author
      await supabase.from('notifications').insert([{ recipient: post.author, type: 'like', payload: { from: user.id, post: post.id } }]);
    }
    onAction && onAction();
  };

  const remove = async () => {
    if (!user || user.id !== post.author) return;
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) return alert('Error deleting post');
    onAction && onAction();
  };

  return (
    <div className="card mb-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-muted/10 flex items-center justify-center text-sm">{post.author_display_name?.[0] ?? 'U'}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <Link to={`/profile/${post.author}`} className="font-semibold">{post.author_display_name || post.author}</Link>
              <div className="text-xs text-muted">{new Date(post.created_at).toLocaleString()}</div>
            </div>
            <div className="text-sm text-muted">{likesCount} likes</div>
          </div>
          <div className="mt-2 text-base">{post.content}</div>
          <div className="mt-3 flex items-center gap-2">
            <button onClick={toggleLike} className="text-sm text-muted hover:text-accent">{liked ? 'Unlike' : 'Like'}</button>
            <Link to={`/post/${post.id}`} className="text-sm text-muted hover:text-accent">Comment</Link>
            {user && user.id === post.author && (
              <button onClick={remove} className="text-sm text-red-400">Delete</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
