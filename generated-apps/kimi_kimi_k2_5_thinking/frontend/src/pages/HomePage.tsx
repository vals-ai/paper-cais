import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type Post } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, TrendingUp, Clock, MessageCircle, Heart, Share2, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function HomePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'trending'>('newest');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    fetchPosts();
    
    // Subscribe to new posts
    const channel = supabase
      .channel('posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sortBy, user]);

  async function fetchPosts() {
    setLoading(true);
    
    let query = supabase
      .from('posts')
      .select(`
        *,
        user:profiles(*),
        likes(count),
        comments(count)
      `);

    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      // For trending, we'll use a combination of likes and recency
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query.limit(50);

    if (!error && data) {
      // If user is logged in, check which posts they liked
      let postsWithLikes = data as Post[];
      
      if (user) {
        const { data: userLikes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', user.id);
          
        const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
        postsWithLikes = postsWithLikes.map(post => ({
          ...post,
          is_liked: likedPostIds.has(post.id),
          likes_count: post.likes?.[0]?.count || 0,
          comments_count: post.comments?.[0]?.count || 0,
        }));
      } else {
        postsWithLikes = postsWithLikes.map(post => ({
          ...post,
          likes_count: post.likes?.[0]?.count || 0,
          comments_count: post.comments?.[0]?.count || 0,
        }));
      }
      
      // Sort by trending if selected
      if (sortBy === 'trending') {
        postsWithLikes.sort((a, b) => {
          const scoreA = (a.likes_count || 0) * 10 + (a.comments_count || 0) * 5;
          const scoreB = (b.likes_count || 0) * 10 + (b.comments_count || 0) * 5;
          return scoreB - scoreA;
        });
      }
      
      setPosts(postsWithLikes);
    }
    
    setLoading(false);
  }

  async function handlePost() {
    if (!user || !newPostContent.trim()) return;
    
    if (newPostContent.length > 280) {
      toast({
        title: 'Error',
        description: 'Post cannot exceed 280 characters',
        variant: 'destructive',
      });
      return;
    }

    setPosting(true);
    
    const { error } = await supabase
      .from('posts')
      .insert({ user_id: user.id, content: newPostContent.trim() });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setNewPostContent('');
      toast({
        title: 'Success',
        description: 'Post created!',
      });
      fetchPosts();
    }
    
    setPosting(false);
  }

  async function handleLike(postId: string) {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like posts',
      });
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.is_liked) {
      // Unlike
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);
    } else {
      // Like
      await supabase
        .from('likes')
        .insert({ user_id: user.id, post_id: postId });
    }

    fetchPosts();
  }

  async function handleDeletePost(postId: string) {
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
      fetchPosts();
    }
  }

  async function handleEditPost() {
    if (!editingPost || !editContent.trim()) return;
    
    if (editContent.length > 280) {
      toast({
        title: 'Error',
        description: 'Post cannot exceed 280 characters',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('posts')
      .update({ content: editContent.trim() })
      .eq('id', editingPost.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Post updated!',
      });
      setEditingPost(null);
      fetchPosts();
    }
  }

  function openEditDialog(post: Post) {
    setEditingPost(post);
    setEditContent(post.content);
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b z-10">
        <div className="p-4">
          <h1 className="text-xl font-bold">Home</h1>
        </div>
        <Tabs value={sortBy} onValueChange={(v) => setSortBy(v as 'newest' | 'trending')} className="w-full">
          <TabsList className="w-full rounded-none bg-transparent border-b">
            <TabsTrigger 
              value="newest" 
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Clock className="h-4 w-4 mr-2" />
              Newest
            </TabsTrigger>
            <TabsTrigger 
              value="trending"
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Trending
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Post Creation */}
      {user && (
        <div className="p-4 border-b">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback>{profile?.display_name?.[0] || profile?.username?.[0] || '?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="What's happening?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="min-h-[100px] border-none resize-none focus-visible:ring-0 text-lg"
                maxLength={280}
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-sm ${newPostContent.length > 280 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {newPostContent.length}/280
                </span>
                <Button 
                  onClick={handlePost} 
                  disabled={!newPostContent.trim() || posting || newPostContent.length > 280}
                  className="rounded-full px-6"
                >
                  {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="divide-y">
        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No posts yet. Be the first to post!</p>
          </div>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="rounded-none border-0 border-b hover:bg-accent/50 transition-colors">
              <div className="p-4">
                <div className="flex gap-3">
                  <Link to={`/profile/${post.user?.username}`}>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.user?.avatar_url || undefined} />
                      <AvatarFallback>{post.user?.display_name?.[0] || post.user?.username?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link to={`/profile/${post.user?.username}`} className="font-semibold hover:underline">
                          {post.user?.display_name || post.user?.username}
                        </Link>
                        <span className="text-muted-foreground">@{post.user?.username}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground text-sm">{formatDate(post.created_at)}</span>
                      </div>
                      {user?.id === post.user_id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(post)}>
                              <Edit2 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <Link to={`/post/${post.id}`} className="block mt-1">
                      <p className="whitespace-pre-wrap">{post.content}</p>
                    </Link>
                    <div className="flex items-center gap-6 mt-3 text-muted-foreground">
                      <button 
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                        onClick={() => handleLike(post.id)}
                      >
                        <Heart className={`h-5 w-5 ${post.is_liked ? 'fill-red-500 text-red-500' : ''}`} />
                        <span className="text-sm">{post.likes_count || 0}</span>
                      </button>
                      <Link 
                        to={`/post/${post.id}`}
                        className="flex items-center gap-2 hover:text-primary transition-colors"
                      >
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-sm">{post.comments_count || 0}</span>
                      </Link>
                      <button className="flex items-center gap-2 hover:text-primary transition-colors">
                        <Share2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPost} onOpenChange={() => setEditingPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[150px]"
            maxLength={280}
          />
          <div className="flex items-center justify-between">
            <span className={`text-sm ${editContent.length > 280 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {editContent.length}/280
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditingPost(null)}>
                Cancel
              </Button>
              <Button 
                onClick={handleEditPost}
                disabled={!editContent.trim() || editContent.length > 280}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}