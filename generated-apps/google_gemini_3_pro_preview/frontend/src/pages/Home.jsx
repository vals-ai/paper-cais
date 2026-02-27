import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Post from '@/components/Post';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch posts
  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:profiles!posts_user_id_fkey (username, full_name, avatar_url),
        likes:likes!likes_post_id_fkey (user_id),
        comments:comments!comments_post_id_fkey (count)
      `)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setPosts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async () => {
    if (!content.trim()) return;

    if (content.length > 280) return alert('Post content varies max 280 characters');

    const { error } = await supabase
      .from('posts')
      .insert([{ content, user_id: user.id }]);

    if (!error) {
      setContent('');
      fetchPosts();
    } else {
        console.error(error);
    }
  };

  return (
    <div className="w-full">
       <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4">
            <h1 className="text-xl font-bold">Home</h1>
       </div>
       
       {user && (
         <div className="border-b p-4 flex space-x-4">
             <Avatar>
                 <AvatarImage src={user.user_metadata?.avatar_url} />
                 <AvatarFallback>{user.user_metadata?.full_name?.charAt(0) || 'U'}</AvatarFallback>
             </Avatar>
             <div className="flex-1 space-y-4">
                 <Textarea 
                    placeholder="What is happening?!" 
                    className="border-none text-xl resize-none focus-visible:ring-0 px-0 min-h-[100px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    maxLength={280}
                 />
                 <div className="flex justify-between items-center border-t pt-2">
                     <span className={`text-sm ${content.length > 280 ? 'text-red-500' : 'text-muted-foreground'}`}>
                         {content.length}/280
                     </span>
                     <Button onClick={handleCreatePost} disabled={!content.trim() || content.length > 280} className="rounded-full">Post</Button>
                 </div>
             </div>
         </div>
       )}

       <div className="divide-y pb-20 md:pb-0">
            {posts.map(post => (
                <Post key={post.id} post={post} onDelete={(id) => setPosts(posts.filter(p => p.id !== id))} />
            ))}
            {loading && <p className="p-4 text-center text-muted-foreground">Loading posts...</p>}
            {!loading && posts.length === 0 && <p className="p-4 text-center text-muted-foreground">No posts yet.</p>}
       </div>
    </div>
  );
}
