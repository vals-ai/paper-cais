import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PostItem from '../components/PostItem';
import { Button } from '../components/ui/button';
import { User, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

const Profile = ({ session }) => {
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  async function fetchProfile() {
    setLoading(true);
    // Get profile
    const { data: pData, error: pError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (pData) {
      setProfile(pData);
      
      // Get posts
      const { data: postData } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .eq('user_id', pData.id)
        .order('created_at', { ascending: false });
      setPosts(postData || []);

      // Get follow stats
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', pData.id);
      setFollowerCount(followers || 0);

      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', pData.id);
      setFollowingCount(following || 0);

      // Check if current user follows this profile
      if (session && session.user.id !== pData.id) {
        const { data: followData } = await supabase
          .from('follows')
          .select('*')
          .eq('follower_id', session.user.id)
          .eq('following_id', pData.id)
          .single();
        setIsFollowing(!!followData);
      }
    }
    setLoading(false);
  }

  const toggleFollow = async () => {
    if (!session || !profile) return;

    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', session.user.id).eq('following_id', profile.id);
      setIsFollowing(false);
      setFollowerCount(prev => prev - 1);
    } else {
      await supabase.from('follows').insert([{ follower_id: session.user.id, following_id: profile.id }]);
      setIsFollowing(true);
      setFollowerCount(prev => prev + 1);

      // Notify
      await supabase.from('notifications').insert([{
          user_id: profile.id,
          actor_id: session.user.id,
          type: 'follow'
      }]);
    }
  };

  if (loading) return <div className="text-center py-12">Loading profile...</div>;
  if (!profile) return <div className="text-center py-12">Profile not found.</div>;

  return (
    <div className="space-y-6">
      <div className="relative border rounded-xl bg-card overflow-hidden">
        <div className="h-32 bg-primary/20 w-full" />
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-12 mb-4">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-24 h-24 rounded-full border-4 border-card bg-card object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-card bg-muted flex items-center justify-center">
                <User size={48} className="text-muted-foreground" />
              </div>
            )}
            {session && session.user.id !== profile.id && (
              <Button
                variant={isFollowing ? "outline" : "default"}
                onClick={toggleFollow}
                className="rounded-full px-6"
              >
                {isFollowing ? "Following" : "Follow"}
              </Button>
            )}
            {session && session.user.id === profile.id && (
              <Button variant="outline" className="rounded-full px-6">Edit Profile</Button>
            )}
          </div>
          
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>

          <p className="mt-4 text-foreground whitespace-pre-wrap">{profile.bio || "No bio yet."}</p>

          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-1">
              <span className="font-bold">{followingCount}</span>
              <span className="text-muted-foreground">Following</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold">{followerCount}</span>
              <span className="text-muted-foreground">Followers</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground ml-auto">
              <Calendar size={14} />
              <span>Joined {format(new Date(profile.created_at), 'MMMM yyyy')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold border-b pb-2">Recent Activity</h2>
        <div className="divide-y border rounded-lg bg-card overflow-hidden">
          {posts.length > 0 ? (
            posts.map(post => (
              <PostItem 
                key={post.id} 
                post={post} 
                session={session} 
                onDelete={(id) => setPosts(posts.filter(p => p.id !== id))}
              />
            ))
          ) : (
            <div className="p-8 text-center text-muted-foreground">No posts yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
