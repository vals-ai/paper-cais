import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PostItem from '../components/PostItem';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { User } from 'lucide-react';

const PostDetail = ({ session }) => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPostAndComments();
  }, [id]);

  async function fetchPostAndComments() {
    setLoading(true);
    // Fetch post
    const { data: pData } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .eq('id', id)
      .single();
    
    if (pData) {
      setPost(pData);
      // Fetch comments
      const { data: cData } = await supabase
        .from('comments')
        .select('*, profiles(*)')
        .eq('post_id', id)
        .order('created_at', { ascending: true });
      setComments(cData || []);
    }
    setLoading(false);
  }

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentContent.trim() || !session) return;

    const { data, error } = await supabase
      .from('comments')
      .insert([{
        post_id: id,
        user_id: session.user.id,
        content: commentContent
      }])
      .select('*, profiles(*)');

    if (data) {
      setComments([...comments, data[0]]);
      setCommentContent('');
      
      // Notify
      if (post.user_id !== session.user.id) {
        await supabase.from('notifications').insert([{
            user_id: post.user_id,
            actor_id: session.user.id,
            type: 'comment',
            post_id: id
        }]);
      }
    }
  };

  if (loading) return <div className="text-center py-12">Loading conversation...</div>;
  if (!post) return <div className="text-center py-12">Post not found.</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border rounded-lg bg-card overflow-hidden">
        <PostItem post={post} session={session} />
        
        <div className="p-4 bg-muted/20 border-t">
          <form onSubmit={handleComment} className="flex gap-4">
            <Input
              placeholder="Post your reply"
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              className="rounded-full"
            />
            <Button type="submit" disabled={!commentContent.trim() || !session} className="rounded-full px-6">
              Reply
            </Button>
          </form>
        </div>

        <div className="divide-y overflow-hidden">
          {comments.map(comment => (
            <div key={comment.id} className="p-4 flex gap-4">
              <Link to={`/profile/${comment.profiles.username}`}>
                <img 
                  src={comment.profiles.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder'} 
                  alt={comment.profiles.username} 
                  className="w-10 h-10 rounded-full object-cover" 
                />
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link to={`/profile/${comment.profiles.username}`} className="font-bold text-sm hover:underline">
                    {comment.profiles.display_name}
                  </Link>
                  <span className="text-muted-foreground text-xs">@{comment.profiles.username}</span>
                  <span className="text-muted-foreground text-xs">·</span>
                  <span className="text-muted-foreground text-xs">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                </div>
                <p className="mt-1 text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
