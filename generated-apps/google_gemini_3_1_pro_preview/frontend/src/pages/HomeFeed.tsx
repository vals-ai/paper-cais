import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import PostItem from '@/components/PostItem';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export default function HomeFeed() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [postLoading, setPostLoading] = useState(false);
  const [feedType, setFeedType] = useState('following'); // or 'popular'

  const fetchPosts = async () => {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select('*, author:profiles(*), likes(count), comments(count)', { count: 'exact' });

    if (feedType === 'following') {
      const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', profile.id);
      const followingIds = follows ? follows.map(f => f.following_id) : [];
      followingIds.push(profile.id); // Also show own posts
      query = query.in('author_id', followingIds)
                   .order('created_at', { ascending: false });
    } else {
      // Popular logic: For MVP, maybe just all posts ordered by newest, or we could order by likes but Supabase doesn't easily order by relation count without a view.
      // We will just fetch newest all posts.
      query = query.order('created_at', { ascending: false }).limit(50);
    }

    const { data } = await query;
    
    // Get user likes
    if (data && data.length > 0) {
      const postIds = data.map((p: any) => p.id);
      const { data: userLikes } = await supabase.from('likes').select('post_id').eq('user_id', profile.id).in('post_id', postIds);
      const likedPostIds = new Set(userLikes?.map(l => l.post_id) || []);
      
      const enriched = data.map((p: any) => ({
        ...p,
        has_liked: likedPostIds.has(p.id)
      }));
      setPosts(enriched);
    } else {
      setPosts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [feedType]);

  const handlePost = async () => {
    if (!content.trim() || content.length > 280) return;
    setPostLoading(true);
    const { data } = await supabase.from('posts').insert([{
      author_id: profile.id,
      content: content.trim()
    }]).select('*, author:profiles(*), likes:likes(count), comments(count)').single();

    if (data) {
      setPosts([{ ...data, has_liked: false }, ...posts]);
      setContent('');
    }
    setPostLoading(false);
  };

  const handleDelete = async (postId: string) => {
    if(confirm('Are you sure you want to delete this post?')) {
      await supabase.from('posts').delete().eq('id', postId);
      setPosts(posts.filter(p => p.id !== postId));
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Home</h1>
      
      <div className="mb-6 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-950">
        <div className="flex gap-4">
          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-600 dark:text-zinc-400 uppercase">
            {profile?.avatar_url ? <img src={profile.avatar_url} className="h-full w-full object-cover rounded-full" /> : profile?.username?.charAt(0)}
          </div>
          <div className="flex-1 space-y-3">
            <Textarea 
              placeholder="What's happening?" 
              className="resize-none border-0 focus-visible:ring-0 p-0 text-lg bg-transparent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              maxLength={280}
            />
            <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3">
              <span className={`text-sm ${content.length > 250 ? 'text-red-500' : 'text-zinc-500'}`}>
                {content.length}/280
              </span>
              <Button onClick={handlePost} disabled={!content.trim() || postLoading}>
                {postLoading ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="following" onValueChange={setFeedType} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="popular">Global</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-zinc-500 py-10">No posts to show yet. Follow people or check Global feed.</p>
      ) : (
        <div>
          {posts.map(post => (
            <PostItem key={post.id} post={post} onUpdate={fetchPosts} onDelete={() => handleDelete(post.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
