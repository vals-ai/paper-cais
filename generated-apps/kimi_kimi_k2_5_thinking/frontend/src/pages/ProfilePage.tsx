import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type Post, type Profile } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Calendar, ArrowLeft, Heart, MessageCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isMyProfile, setIsMyProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username, user]);

  async function fetchProfile() {
    setLoading(true);
    
    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (profileError || !profileData) {
      toast({
        title: 'Error',
        description: 'Profile not found',
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    setProfile(profileData);
    setEditDisplayName(profileData.display_name || '');
    setEditBio(profileData.bio || '');
    setIsMyProfile(user?.id === profileData.id);

    // Fetch posts
    const { data: postsData } = await supabase
      .from('posts')
      .select(`
        *,
        user:profiles(*),
        likes(count),
        comments(count)
      `)
      .eq('user_id', profileData.id)
      .order('created_at', { ascending: false });

    if (postsData) {
      const postsWithCounts = postsData.map(post => ({
        ...post,
        likes_count: post.likes?.[0]?.count || 0,
        comments_count: post.comments?.[0]?.count || 0,
      }));
      setPosts(postsWithCounts);
    }

    // Fetch follow counts
    const { count: followers } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profileData.id);
    setFollowersCount(followers || 0);

    const { count: following } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profileData.id);
    setFollowingCount(following || 0);

    // Check if current user is following this profile
    if (user && user.id !== profileData.id) {
      const { data: followData } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', profileData.id)
        .single();
      setIsFollowing(!!followData);
    }

    setLoading(false);
  }

  async function handleFollow() {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to follow users',
      });
      return;
    }

    if (!profile) return;

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', profile.id);
      setIsFollowing(false);
      setFollowersCount(prev => prev - 1);
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: profile.id });
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    }
  }

  async function handleSaveProfile() {
    if (!user || !profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: editDisplayName.trim() || null,
        bio: editBio.trim() || null,
      })
      .eq('id', user.id);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Profile updated!',
      });
      setEditingProfile(false);
      fetchProfile();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Profile not found</p>
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
          <div>
            <h1 className="text-xl font-bold">{profile.display_name || profile.username}</h1>
            <p className="text-sm text-muted-foreground">{posts.length} posts</p>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="p-4 border-b">
        <div className="flex justify-between items-start mb-4">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-3xl">{profile.display_name?.[0] || profile.username?.[0] || '?'}</AvatarFallback>
          </Avatar>
          {isMyProfile ? (
            <Button variant="outline" onClick={() => setEditingProfile(true)}>
              Edit Profile
            </Button>
          ) : (
            <Button 
              onClick={handleFollow}
              variant={isFollowing ? 'outline' : 'default'}
            >
              {isFollowing ? 'Following' : 'Follow'}
            </Button>
          )}
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-bold">{profile.display_name || profile.username}</h2>
          <p className="text-muted-foreground">@{profile.username}</p>
        </div>

        {profile.bio && (
          <p className="mb-4 whitespace-pre-wrap">{profile.bio}</p>
        )}

        <div className="flex items-center gap-4 text-muted-foreground text-sm mb-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="flex gap-4 text-sm">
          <Link to={`/profile/${profile.username}/following`} className="hover:underline">
            <span className="font-bold">{followingCount}</span>
            <span className="text-muted-foreground ml-1">Following</span>
          </Link>
          <Link to={`/profile/${profile.username}/followers`} className="hover:underline">
            <span className="font-bold">{followersCount}</span>
            <span className="text-muted-foreground ml-1">Followers</span>
          </Link>
        </div>
      </div>

      {/* Posts */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full rounded-none bg-transparent border-b">
          <TabsTrigger 
            value="posts" 
            className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger 
            value="likes"
            className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Likes
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts" className="mt-0">
          <div className="divide-y">
            {posts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <Card key={post.id} className="rounded-none border-0 border-b hover:bg-accent/50 transition-colors">
                  <Link to={`/post/${post.id}`} className="block p-4">
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{profile.display_name?.[0] || profile.username?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{profile.display_name || profile.username}</span>
                          <span className="text-muted-foreground">@{profile.username}</span>
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
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="likes" className="mt-0">
          <div className="p-8 text-center text-muted-foreground">
            <p>Liked posts will appear here</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Display Name</label>
              <Input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Your display name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bio</label>
              <Textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Tell us about yourself"
                maxLength={160}
              />
              <span className="text-sm text-muted-foreground">{editBio.length}/160</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingProfile(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}