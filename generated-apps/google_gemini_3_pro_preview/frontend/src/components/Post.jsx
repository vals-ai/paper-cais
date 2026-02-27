import { formatDistanceToNow } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function Post({ post: initialPost, onDelete }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(initialPost);
  const [isLiked, setIsLiked] = useState(post.likes?.some(like => like.user_id === user?.id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return navigate('/login');

    if (isLiked) {
        setLikesCount(prev => prev - 1);
        setIsLiked(false);
        const { error } = await supabase.from('likes').delete().match({ post_id: post.id, user_id: user.id });
        if (error) {
             setLikesCount(prev => prev + 1);
             setIsLiked(true);
        }
    } else {
        setLikesCount(prev => prev + 1);
        setIsLiked(true);
        const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
         if (error) {
             setLikesCount(prev => prev - 1);
             setIsLiked(false);
        }
    }
  };

  const handleClick = () => {
      navigate(`/post/${post.id}`);
  };

  const handleDelete = async (e) => {
      e.stopPropagation();
      if (!confirm('Are you sure you want to delete this post?')) return;
      onDelete(post.id); // Optimistic content update
      await supabase.from('posts').delete().eq('id', post.id);
  };

  return (
    <div className="border-b p-4 hover:bg-muted/10 transition-colors cursor-pointer block" onClick={handleClick}>
      <div className="flex space-x-3">
        <Link to={`/profile/${post.user_id}`} onClick={(e) => e.stopPropagation()}>
             <Avatar>
                <AvatarImage src={post.profiles?.avatar_url} />
                <AvatarFallback>{post.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
             <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                    <Link to={`/profile/${post.user_id}`} onClick={(e) => e.stopPropagation()} className="font-bold hover:underline truncate">
                        {post.profiles?.full_name}
                    </Link>
                    <span className="text-muted-foreground text-sm truncate">@{post.profiles?.username}</span>
                    <span className="text-muted-foreground text-sm shrink-0">· {formatDistanceToNow(new Date(post.created_at))} ago</span>
                </div>
                {user?.id === post.user_id && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                )}
             </div>
             <p className="mt-1 whitespace-pre-wrap break-words">{post.content}</p>
             <div className="flex items-center space-x-8 mt-3 text-muted-foreground">
                <Button variant="ghost" size="sm" className={`p-0 h-auto space-x-2 hover:bg-transparent hover:text-primary ${isLiked ? 'text-red-500 hover:text-red-600' : ''}`} onClick={handleLike}>
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span>{likesCount}</span>
                </Button>
                <div className="flex items-center space-x-2 hover:text-primary">
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.comments ? (Array.isArray(post.comments) ? post.comments.length : post.comments[0]?.count) : 0}</span>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
}
