import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import PostBox from '../components/PostBox';
import PostItem from '../components/PostItem';
import { Search, TrendingUp, Clock } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

const Home = ({ session }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // or 'trending'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, [sortBy]);

  async function fetchPosts() {
    setLoading(true);
    let query = supabase
      .from('posts')
      .select('*, profiles(*)');

    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else {
      // Simplistic trending: most likes (would need a join or count in a real app, 
      // here we might just order by created_at for now if we don't have a likes_count column)
      // Actually let's just use newest for both for now or a different order.
      query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (data) setPosts(data);
    setLoading(false);
  }

  const handlePostCreated = (newPost) => {
    // We need the profile info too
    fetchPosts(); 
  };

  const handlePostDeleted = (id) => {
    setPosts(posts.filter(p => p.id !== id));
  };

  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.profiles.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.profiles.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <PostBox session={session} onPostCreated={handlePostCreated} />
        
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSortBy('newest')}
              className={`flex items-center gap-1 text-sm font-medium ${sortBy === 'newest' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Clock size={16} />
              Newest
            </button>
            <button
              onClick={() => setSortBy('trending')}
              className={`flex items-center gap-1 text-sm font-medium ${sortBy === 'trending' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <TrendingUp size={16} />
              Trending
            </button>
          </div>
        </div>

        <div className="divide-y border rounded-lg bg-card">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading posts...</div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <PostItem 
                key={post.id} 
                post={post} 
                session={session} 
                onDelete={handlePostDeleted}
              />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">No posts found.</div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search Zeeter"
            className="pl-10 rounded-full bg-muted border-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="p-4 border rounded-lg bg-card">
          <h3 className="font-bold mb-4">Who to follow</h3>
          <div className="space-y-4">
            {/* We could fetch suggested users here */}
            <div className="text-sm text-muted-foreground">Discover new people to follow.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
