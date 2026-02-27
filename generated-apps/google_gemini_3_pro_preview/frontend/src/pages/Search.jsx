import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import Post from '@/components/Post';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ posts: [], profiles: [] });
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    
    // Search posts
    const { data: posts } = await supabase
      .from('posts')
      .select(`
          *,
          profiles:profiles!posts_user_id_fkey (username, full_name, avatar_url),
          likes:likes!likes_post_id_fkey (user_id),
          comments:comments!comments_post_id_fkey (count)
      `)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    // Search profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);
      
    setResults({ posts: posts || [], profiles: profiles || [] });
    setLoading(false);
  };

  return (
    <div className="w-full">
         <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4">
            <form onSubmit={handleSearch}>
                <Input 
                    placeholder="Search posts or people" 
                    value={query} 
                    onChange={(e) => setQuery(e.target.value)} 
                    className="rounded-full bg-secondary"
                />
            </form>
         </div>
         
         {loading && <p className="p-4 text-center">Searching...</p>}
         
         <div className="divide-y pb-20 md:pb-0">
             {results.profiles.length > 0 && (
                 <div className="p-4">
                     <h2 className="font-bold mb-4">People</h2>
                     <div className="space-y-4">
                         {results.profiles.map(profile => (
                             <Link key={profile.id} to={`/profile/${profile.id}`} className="flex items-center space-x-3 hover:bg-muted/10 p-2 rounded-lg transition-colors">
                                 <Avatar>
                                     <AvatarImage src={profile.avatar_url} />
                                     <AvatarFallback>{profile.full_name?.charAt(0)}</AvatarFallback>
                                 </Avatar>
                                 <div>
                                     <p className="font-bold">{profile.full_name}</p>
                                     <p className="text-muted-foreground text-sm">@{profile.username}</p>
                                 </div>
                             </Link>
                         ))}
                     </div>
                 </div>
             )}
             
             {results.posts.length > 0 && (
                 <div>
                     <h2 className="font-bold p-4 bg-muted/20">Posts</h2>
                     {results.posts.map(post => (
                         <Post key={post.id} post={post} onDelete={() => {}} />
                     ))}
                 </div>
             )}
             
             {!loading && query && results.posts.length === 0 && results.profiles.length === 0 && (
                 <p className="p-8 text-center text-muted-foreground">No results for "{query}"</p>
             )}
         </div>
    </div>
  );
}
