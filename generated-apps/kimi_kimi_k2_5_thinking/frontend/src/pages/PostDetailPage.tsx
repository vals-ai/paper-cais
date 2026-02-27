import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type Post, type Comment } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ArrowLeft, Heart, MessageCircle, Share2, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

export function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId, user]);

  async function fetchPost() {
    setLoading(true);
    
    // Fetch post
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('id', postId)
      .single();

    if (postError || !postData) {
      toast({
        title: 'Error',
        description: 'Post not found',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    setPost(postData);

    // Fetch likes count
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);
    setLikesCount(count || 0);

    // Check if user liked this post
    if (user) {
      const { data: likeData } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single();
      setIsLiked(!!likeData);
    }

    // Fetch comments
    const { data: commentsData } = await supabase
      .from('comments')
      .select(`
        *,
        user:profiles(*)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (commentsData) {
      setComments(commentsData);
    }

    setLoading(false);
  }

  async function handleLike() {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like posts',
      });
      return;
    }

    if (isLiked) {
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);
      setIsLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      await supabase
        .from('likes')
        .insert({ user_id: user.id, post_id: postId });
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
    }
  }

  async function handleComment() {
    if (!user || !newComment.trim()) return;

    if (newComment.length > 280) {
      toast({
        title: 'Error',
        description: 'Comment cannot exceed 280 characters',
        variant: 'destructive',
      });
      return;
    }

    setPostingComment(true);

    const { error } = await supabase
      .from('comments')
      .insert({ user_id: user.id, post_id: postId, content: newComment.trim() });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setNewComment('');
      toast({
        title: 'Success',
        description: 'Comment posted!',
      });
      fetchPost();
    }

    setPostingComment(false);
  }

  async function handleDeleteComment(commentId: string) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Comment deleted',
      });
      fetchPost();
    }
  }

  async function handleDeletePost() {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Post deleted',
      });
      navigate('/');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Post not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b z-10">
        <div className="p-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Post</h1>
        </div>
      </div>

      {/* Post */}
      <div className="p-4 border-b">
        <div className="flex gap-3">
          <Link to={`/profile/${post.user?.username}`}>
            <Avatar className="h-12 w-12">
              <AvatarImage src={post.user?.avatar_url || undefined} />
              <AvatarFallback>{post.user?.display_name?.[0] || post.user?.username?.[0] || '?'}</AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <Link to={`/profile/${post.user?.username}`} className="font-bold hover:underline">
                  {post.user?.display_name || post.user?.username}
                </Link>
                <p className="text-muted-foreground">@{post.user?.username}</p>
              </div>
              {user?.id === post.user_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDeletePost} className="text-red-500">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xl whitespace-pre-wrap">{post.content}</p>
          <p className="text-muted-foreground mt-4 text-sm">
            {new Date(post.created_at).toLocaleString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-6 mt-4 pt-4 border-t">
          <button 
            className="flex items-center gap-2 hover:text-red-500 transition-colors"
            onClick={handleLike}
          >
            <Heart className={`h-6 w-6 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span>{likesCount}</span>
          </button>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            <span>{comments.length}</span>
          </div>
          <button className="flex items-center gap-2 hover:text-primary transition-colors">
            <Share2 className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Comment Input */}
      {user && (
        <div className="p-4 border-b">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>{profile?.display_name?.[0] || profile?.username?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="Post your reply"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] border-none resize-none focus-visible:ring-0"
                maxLength={280}
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-sm ${newComment.length > 280 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {newComment.length}/280
                </span>
                <Button 
                  onClick={handleComment}
                  disabled={!newComment.trim() || postingComment || newComment.length > 280}
                  className="rounded-full"
                >
                  {postingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reply'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      <div className="divide-y">
        {comments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-4 hover:bg-accent/50 transition-colors">
              <div className="flex gap-3">
                <Link to={`/profile/${comment.user?.username}`}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={comment.user?.avatar_url || undefined} />
                    <AvatarFallback>{comment.user?.display_name?.[0] || comment.user?.username?.[0] || '?'}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link to={`/profile/${comment.user?.username}`} className="font-semibold hover:underline">
                        {comment.user?.display_name || comment.user?.username}
                      </Link>
                      <span className="text-muted-foreground">@{comment.user?.username}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground text-sm">{formatDate(comment.created_at)}</span>
                    </div>
                    {user?.id === comment.user_id && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}