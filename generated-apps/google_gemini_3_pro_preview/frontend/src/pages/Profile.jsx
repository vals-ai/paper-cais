import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Post from '@/components/Post';
import { ArrowLeft, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
          console.error(error);
          setLoading(false);
          return;
      }
      setProfile(data);

      const { data: postsData } = await supabase
        .from('posts')
        .select(`
            *,
            profiles:profiles!posts_user_id_fkey (username, full_name, avatar_url),
            likes:likes!likes_post_id_fkey (user_id),
            comments:comments!comments_post_id_fkey (count)
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false });
      
      setPosts(postsData || []);

      if (user) {
          const { data: follow } = await supabase
              .from('follows')
              .select('*')
              .eq('follower_id', user.id)
              .eq('following_id', id)
              .single();
          setIsFollowing(!!follow);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [id, user]);

  const handleFollow = async () => {
      if (!user) return; 
      if (isFollowing) {
          setIsFollowing(false);
          await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', id);
      } else {
          setIsFollowing(true);
          await supabase.from('follows').insert({ follower_id: user.id, following_id: id });
          await supabase.from('notifications').insert({
              user_id: id,
              actor_id: user.id,
              type: 'start_following'
          });
      }
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (!profile) return <div className="p-4 text-center">User not found</div>;

  return (
    <div className="w-full">
         <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4 flex items-center space-x-4">
             <Link to="/" className="p-2 hover:bg-secondary rounded-full">
                 <ArrowLeft className="w-5 h-5" />
             </Link>
             <div>
                 <h1 className="text-xl font-bold">{profile.full_name}</h1>
                 <p className="text-xs text-muted-foreground">{posts.length} posts</p>
             </div>
         </div>
         
         <div className="relative">
             <div className="h-32 bg-slate-200"></div>
             <div className="px-4 pb-4">
                 <div className="flex justify-between items-start">
                     <Avatar className="w-32 h-32 border-4 border-background -mt-16 bg-muted relative">
                          <AvatarImage src={profile.avatar_url} className="object-cover" />
                          <AvatarFallback className="text-4xl">{profile.full_name?.charAt(0)}</AvatarFallback>
                     </Avatar>
                     <div className="mt-4">
                        {user?.id !== id && (
                             <Button 
                                variant={isFollowing ? "outline" : "default"} 
                                onClick={handleFollow}
                                className="rounded-full font-bold px-6"
                             >
                                {isFollowing ? 'Following' : 'Follow'}
                             </Button>
                         )}
                         {user?.id === id && (
                             <Button variant="outline" className="rounded-full font-bold">Edit Profile</Button>
                         )}
                     </div>
                 </div>
                 
                 <div className="mt-4 space-y-1">
                     <h2 className="text-xl font-bold">{profile.full_name}</h2>
                     <p className="text-muted-foreground">@{profile.username}</p>
                 </div>
                 
                 {profile.bio && <p className="mt-4 text-sm">{profile.bio}</p>}
                 
                 <div className="flex items-center space-x-4 mt-4 text-muted-foreground text-sm">
                     <div className="flex items-center space-x-1">
                         <Calendar className="w-4 h-4" />
                         <span>Joined {profile.created_at ? format(new Date(profile.created_at), 'MMMM yyyy') : 'Recently'}</span>
                     </div>
                 </div>
                 
                 <div className="flex items-center space-x-4 mt-4 text-sm">
                     <span className="font-bold hover:underline cursor-pointer">0 <span className="text-muted-foreground font-normal">Following</span></span>
                     <span className="font-bold hover:underline cursor-pointer">0 <span className="text-muted-foreground font-normal">Followers</span></span>
                 </div>
             </div>
         </div>
         
         <div className="flex border-b mt-2">
             <div className="flex-1 text-center py-4 font-bold border-b-4 border-primary hover:bg-muted/50 transition-colors cursor-pointer">
                 Posts
             </div>
             <div className="flex-1 text-center py-4 text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                 Replies
             </div>
             <div className="flex-1 text-center py-4 text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer">
                 Likes
             </div>
         </div>

         <div className="divide-y pb-20 md:pb-0">
            {posts.map(post => {
                const postWithProfile = { ...post, profiles: profile };
                return <Post key={post.id} post={postWithProfile} onDelete={(pid) => setPosts(posts.filter(p => p.id !== pid))} />
            })}
            {posts.length === 0 && <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                <p className="text-lg font-bold">@{profile.username} hasn't posted yet</p>
                <p className="text-sm">When they do, their posts will show up here.</p>
            </div>}
         </div>
    </div>
  );
}
