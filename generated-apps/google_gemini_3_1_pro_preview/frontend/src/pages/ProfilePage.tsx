import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import PostItem from '@/components/PostItem';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { username } = useParams();
  const { profile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [stats, setStats] = useState({ followers: 0, following: 0 });

  const fetchProfile = async () => {
    setLoading(true);
    const { data: userProfile } = await supabase.from('profiles').select('*').eq('username', username).single();
    
    if (userProfile) {
      setProfile(userProfile);
      
      const { data: userPosts } = await supabase
        .from('posts')
        .select('*, author:profiles(*), likes:likes(count), comments(count)')
        .eq('author_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (userPosts) setPosts(userPosts);

      const [{ count: followers }, { count: following }] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userProfile.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userProfile.id)
      ]);
      setStats({ followers: followers || 0, following: following || 0 });

      if (currentUserProfile && currentUserProfile.id !== userProfile.id) {
        const { data: followData } = await supabase.from('follows').select('*').match({ follower_id: currentUserProfile.id, following_id: userProfile.id }).single();
        setIsFollowing(!!followData);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const toggleFollow = async () => {
    if (isFollowing) {
      await supabase.from('follows').delete().match({ follower_id: currentUserProfile.id, following_id: profile.id });
      setStats({ ...stats, followers: stats.followers - 1 });
      setIsFollowing(false);
    } else {
      await supabase.from('follows').insert([{ follower_id: currentUserProfile.id, following_id: profile.id }]);
      await supabase.from('notifications').insert([{
        user_id: profile.id,
        actor_id: currentUserProfile.id,
        type: 'follow'
      }]);
      setStats({ ...stats, followers: stats.followers + 1 });
      setIsFollowing(true);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>;
  if (!profile) return <div className="text-center py-20 text-xl font-bold">User non trovato.</div>;

  return (
    <div>
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6 relative">
        <div className="flex justify-between items-start">
          <div className="h-24 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-3xl text-zinc-600 dark:text-zinc-400 uppercase">
            {profile.avatar_url ? <img src={profile.avatar_url} className="h-full w-full object-cover rounded-full" /> : profile.username.charAt(0)}
          </div>
          {currentUserProfile?.id !== profile.id && (
            <Button onClick={toggleFollow} variant={isFollowing ? 'outline' : 'default'} className="rounded-full font-bold">
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>
        <div className="mt-4">
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          <p className="text-zinc-500">@{profile.username}</p>
        </div>
        <p className="mt-4 text-zinc-800 dark:text-zinc-200">{profile.bio}</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">
          <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4" /> Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <span><strong className="text-zinc-900 dark:text-zinc-50">{stats.following}</strong> Following</span>
          <span><strong className="text-zinc-900 dark:text-zinc-50">{stats.followers}</strong> Followers</span>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4 border-b pb-2">Posts</h2>
      {posts.length === 0 ? (
        <p className="text-zinc-500 text-center py-10">No posts yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <PostItem key={post.id} post={post} onUpdate={fetchProfile} onDelete={() => {
              setPosts(posts.filter(p => p.id !== post.id));
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
