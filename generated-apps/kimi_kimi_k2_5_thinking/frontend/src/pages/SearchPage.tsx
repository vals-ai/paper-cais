import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, type Post, type Profile } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search as SearchIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle } from 'lucide-react';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(query);
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  async function performSearch(searchQuery: string) {
    if (!searchQuery.trim()) {
      setPosts([]);
      setUsers([]);
      return;
    }

    setLoading(true);

    // Search posts
    const { data: postsData } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles(*),
        likes(count),
        comments(count)
      `)
      .ilike('content', `%${searchQuery}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (postsData) {
      const postsWithCounts = postsData.map(post => ({
        ...post,
        likes_count: post.likes?.[0]?.count || 0,
        comments_count: post.comments?.[0]?.count || 0,
      }));
      setPosts(postsWithCounts);
    }

    // Search users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
      .limit(20);

    if (usersData) {
      setUsers(usersData);
    }

    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
    }
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b z-10">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">Search</h1>
          <form onSubmit={handleSearch}>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts, people, or hashtags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      {query ? (
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full rounded-none bg-transparent border-b">
            <TabsTrigger 
              value="posts" 
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              Posts ({posts.length})
            </TabsTrigger>
            <TabsTrigger 
              value="users"
              className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              People ({users.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-0">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : posts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No posts found for "{query}"</p>
              </div>
            ) : (
              <div className="divide-y">
                {posts.map((post) => (
                  <Card key={post.id} className="rounded-none border-0 border-b hover:bg-accent/50 transition-colors">
                    <Link to={`/post/${post.id}`} className="block p-4">
                      <div className="flex gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={post.user?.avatar_url || undefined} />
                          <AvatarFallback>{post.user?.display_name?.[0] || post.user?.username?.[0] || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{post.user?.display_name || post.user?.username}</span>
                            <span className="text-muted-foreground">@{post.user?.username}</span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground text-sm">{formatDate(post.created_at)}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap">{post.content}</p>
                          <div className="flex items-center gap-6 mt-3 text-muted-foreground">
                            <span className="flex items-center gap-2">
                              <Heart className="h-5 w-5" />
                              <span className="text-sm">{post.likes_count || 0}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <MessageCircle className="h-5 w-5" />
                              <span className="text-sm">{post.comments_count || 0}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            {loading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No users found for "{query}"</p>
              </div>
            ) : (
              <div className="divide-y">
                {users.map((user) => (
                  <Link
                    key={user.id}
                    to={`/profile/${user.username}`}
                    className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>{user.display_name?.[0] || user.username?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{user.display_name || user.username}</p>
                      <p className="text-muted-foreground">@{user.username}</p>
                      {user.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{user.bio}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          <SearchIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">Search for posts and people</p>
          <p className="text-sm">Try searching for keywords, usernames, or hashtags</p>
        </div>
      )}
    </div>
  );
}