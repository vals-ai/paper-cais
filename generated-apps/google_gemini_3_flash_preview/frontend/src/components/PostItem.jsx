import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, MessageCircle, Edit2, Trash2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

const PostItem = ({ post, session, onDelete }) => {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  useEffect(() => {
    fetchPostData();
  }, [post.id]);

  async function fetchPostData() {
    // Likes
    const { count: likesCount } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', post.id);
    
    setLikes(likesCount || 0);

    if (session) {
      const { data: userLike } = await supabase
        .from('likes')
        .select('*')
        .eq('post_id', post.id)
        .eq('user_id', session.user.id)
        .single();
      setIsLiked(!!userLike);
    }

    // Comments
    const { count: cCount } = await supabase
      .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);
    setCommentsCount(cCount || 0);
  }

  const toggleLike = async () => {
    if (!session) return;

    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', session.user.id);
      setLikes(likes - 1);
      setIsLiked(false);
    } else {
      await supabase.from('likes').insert([{ post_id: post.id, user_id: session.user.id }]);
      setLikes(likes + 1);
      setIsLiked(true);
      
      // Notify
      if (post.user_id !== session.user.id) {
        await supabase.from('notifications').insert([{
            user_id: post.user_id,
            actor_id: session.user.id,
            type: 'like',
            post_id: post.id
        }]);
      }
    }
  };

  const handleUpdate = async () => {
    if (editContent.length > 280) return;
    const { error } = await supabase
      .from('posts')
      .update({ content: editContent, updated_at: new Date() })
      .eq('id', post.id);
    if (!error) {
      post.content = editContent;
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      const { error } = await supabase.from('posts').delete().eq('id', post.id);
      if (!error && onDelete) onDelete(post.id);
    }
  };

  return (
    <div className="border-b p-4 hover:bg-muted/30 transition-colors">
      <div className="flex gap-4">
        <Link to={`/profile/${post.profiles.username}`}>
          {post.profiles.avatar_url ? (
            <img src={post.profiles.avatar_url} alt={post.profiles.display_name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <User size={24} />
            </div>
          )}
        </Link>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to={`/profile/${post.profiles.username}`} className="font-bold hover:underline">
                {post.profiles.display_name}
              </Link>
              <span className="text-muted-foreground text-sm">@{post.profiles.username}</span>
              <span className="text-muted-foreground text-sm">·</span>
              <span className="text-muted-foreground text-sm">{formatDistanceToNow(new Date(post.created_at))} ago</span>
            </div>
            {session?.user.id === post.user_id && (
              <div className="flex items-center gap-2">
                <button onClick={() => setIsEditing(!isEditing)} className="text-muted-foreground hover:text-primary">
                  <Edit2 size={16} />
                </button>
                <button onClick={handleDelete} className="text-muted-foreground hover:text-destructive">
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                className="w-full bg-transparent border rounded-md p-2 text-sm focus:ring-1 focus:ring-primary"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={handleUpdate}>Save</Button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-foreground whitespace-pre-wrap">{post.content}</p>
          )}

          <div className="mt-4 flex items-center gap-6 text-muted-foreground">
            <button
              onClick={toggleLike}
              className={cn("flex items-center gap-1.5 transition-colors group", isLiked && "text-red-500")}
            >
              <Heart size={18} className={cn("group-hover:fill-current", isLiked && "fill-current")} />
              <span className="text-sm">{likes}</span>
            </button>
            <Link to={`/post/${post.id}`} className="flex items-center gap-1.5 hover:text-primary transition-colors group">
              <MessageCircle size={18} />
              <span className="text-sm">{commentsCount}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostItem;
