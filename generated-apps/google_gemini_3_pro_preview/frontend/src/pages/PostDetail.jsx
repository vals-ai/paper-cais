import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Post from '@/components/Post';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      setLoading(true);
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:profiles!posts_user_id_fkey (username, full_name, avatar_url),
          likes:likes!likes_post_id_fkey (user_id),
          comments:comments!comments_post_id_fkey (count)
        `)
        .eq('id', id)
        .single();
      
      if (postError) {
          console.error(postError);
          // could redirect to 404
      } else {
        setPost(postData);
        // fetch comments separately to get user details
        const { data: commentsData, error: commentsError } = await supabase
            .from('comments')
            .select(`
              *,
              profiles:profiles!comments_user_id_fkey (username, full_name, avatar_url)
            `)
            .eq('post_id', id)
            .order('created_at', { ascending: true });

         if (commentsError) console.error(commentsError);
         else setComments(commentsData);
      }
      setLoading(false);
    };
    fetchPost();
  }, [id]);

  const handleComment = async () => {
    if (!commentContent.trim()) return;
    
    const { error } = await supabase.from('comments').insert({
        post_id: post.id,
        user_id: user.id,
        content: commentContent
    });

    if (!error) {
        setCommentContent('');
        // Optimistic update or refetch
        // Just refetching comments for simplicity
        const { data } = await supabase.from('comments').select('*, profiles(*)').eq('post_id', id).order('created_at', { ascending: true });
        setComments(data);
    }
  };
  
  const handleDeletePost = () => {
      navigate('/');
  };

  if(!post && !loading) return <div className="p-4 text-center">Post not found</div>;
  if(loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="w-full">
         <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4 flex items-center space-x-4">
             <Link to="/" className="p-2 hover:bg-secondary rounded-full">
                 <ArrowLeft className="w-5 h-5" />
             </Link>
             <h1 className="text-xl font-bold">Post</h1>
         </div>
         <div className="border-b">
           <Post post={post} onDelete={handleDeletePost} />
         </div>

         <div className="border-b p-4">
             {user ? (
                 <div className="flex space-x-3">
                     <Avatar className="w-8 h-8">
                         <AvatarImage src={user.user_metadata?.avatar_url} />
                         <AvatarFallback>{user.user_metadata?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                     </Avatar>
                     <div className="flex-1 space-y-2">
                         <Textarea 
                            placeholder="Post your reply" 
                            className="border-none resize-none min-h-[50px] focus-visible:ring-0 px-0"
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                         />
                         <div className="flex justify-end">
                             <Button onClick={handleComment} disabled={!commentContent.trim()} size="sm" className="rounded-full">Reply</Button>
                         </div>
                     </div>
                 </div>
             ) : (
                <p className="text-muted-foreground text-center text-sm">Log in to reply</p>
             )}
         </div>

         <div className="divide-y pb-20 md:pb-0">
             {comments.map(comment => (
                 <div key={comment.id} className="p-4 flex space-x-3 hover:bg-muted/10 transition-colors">
                     <Link to={`/profile/${comment.user_id}`}>
                         <Avatar className="w-8 h-8">
                             <AvatarImage src={comment.profiles?.avatar_url} />
                             <AvatarFallback>{comment.profiles?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                         </Avatar>
                     </Link>
                     <div className="flex-1">
                         <div className="flex items-center space-x-2">
                             <Link to={`/profile/${comment.user_id}`} className="font-bold hover:underline text-sm">{comment.profiles?.full_name}</Link>
                             <span className="text-muted-foreground text-sm">@{comment.profiles?.username}</span>
                             <span className="text-muted-foreground text-sm">· {formatDistanceToNow(new Date(comment.created_at))} ago</span>
                         </div>
                         <p className="text-sm mt-1">{comment.content}</p>
                     </div>
                 </div>
             ))}
         </div>
    </div>
  );
}
