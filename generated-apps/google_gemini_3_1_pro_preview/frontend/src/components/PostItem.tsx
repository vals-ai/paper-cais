import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, MoreHorizontal, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function PostItem({ post, onDelete }: { post: any, onUpdate: () => void, onDelete: () => void }) {
  const { profile } = useAuth();
  const [isLiked, setIsLiked] = useState(post.has_liked);
  const [likeCount, setLikeCount] = useState(post.likes[0]?.count || 0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<any[]>(post.recent_comments || []);

  const handleLike = async () => {
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', profile.id);
      setIsLiked(false);
      setLikeCount(Math.max(0, likeCount - 1));
    } else {
      await supabase.from('likes').insert([{ post_id: post.id, user_id: profile.id }]);
      await supabase.from('notifications').insert([{
        user_id: post.author_id,
        actor_id: profile.id,
        type: 'like',
        post_id: post.id
      }]);
      setIsLiked(true);
      setLikeCount(likeCount + 1);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const { data } = await supabase.from('comments').insert([{
      post_id: post.id,
      author_id: profile.id,
      content: commentText.trim()
    }]).select('*, author:profiles(*)').single();

    if (data) {
      setComments([...comments, data]);
      setCommentText('');
      
      if (post.author_id !== profile.id) {
        await supabase.from('notifications').insert([{
          user_id: post.author_id,
          actor_id: profile.id,
          type: 'comment',
          post_id: post.id
        }]);
      }
    }
  };

  const loadComments = async () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      const { data } = await supabase.from('comments').select('*, author:profiles(*)').eq('post_id', post.id).order('created_at', { ascending: true });
      if (data) setComments(data);
    }
  };

  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-950 mb-4 shadow-sm">
      <div className="flex justify-between items-start">
        <Link to={`/profile/${post.author?.username}`} className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-400 uppercase overflow-hidden">
            {post.author?.avatar_url ? <img src={post.author.avatar_url} className="h-full w-full object-cover" /> : post.author?.username?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold">{post.author?.display_name}</p>
            <p className="text-sm text-zinc-500">@{post.author?.username} · {formatDistanceToNow(new Date(post.created_at))} ago</p>
          </div>
        </Link>
        {profile?.id === post.author_id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="-mr-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDelete} className="text-red-600 cursor-pointer">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <p className="mt-4 whitespace-pre-wrap">{post.content}</p>
      
      <div className="mt-4 flex gap-6 text-zinc-500">
        <button onClick={handleLike} className={`flex items-center gap-1.5 hover:text-red-500 transition-colors ${isLiked ? 'text-red-500' : ''}`}>
          <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">{likeCount}</span>
        </button>
        <button onClick={loadComments} className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{post.comments[0]?.count || comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
          <form onSubmit={handleComment} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Write a reply..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 rounded-full border border-zinc-300 dark:border-zinc-700 bg-transparent px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <Button type="submit" size="sm" disabled={!commentText.trim()} className="rounded-full px-4">Reply</Button>
          </form>
          <div className="space-y-4 pt-2">
            {comments.map((c: any) => (
              <div key={c.id} className="flex gap-3 text-sm">
                <Link to={`/profile/${c.author?.username}`} className="h-8 w-8 flex-shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                  {c.author?.avatar_url ? <img src={c.author.avatar_url} className="h-full w-full object-cover rounded-full" /> : c.author?.username?.charAt(0)}
                </Link>
                <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-2 flex-1">
                  <Link to={`/profile/${c.author?.username}`} className="font-semibold block hover:underline">{c.author?.display_name}</Link>
                  <p className="mt-0.5">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
