import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import PostCard from '../components/PostCard';

export default function Profile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [following, setFollowing] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    setProfile(data);
    const { data: p } = await supabase.from('posts').select('*').eq('author', id).order('created_at', { ascending: false });
    setPosts(p || []);
    if (user) {
      const { data: f } = await supabase.from('follows').select('*').match({ follower: user.id, following: id });
      setFollowing((f || []).length > 0);
    }
  };

  useEffect(() => { load(); }, [id, user]);

  const toggleFollow = async () => {
    if (!user) return alert('Please log in to follow');
    if (following) {
      await supabase.from('follows').delete().match({ follower: user.id, following: id });
      setFollowing(false);
    } else {
      await supabase.from('follows').insert([{ follower: user.id, following: id }]);
      setFollowing(true);
      // notify
      await supabase.from('notifications').insert([{ recipient: id, type: 'follow', payload: { follower: user.id } }]);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-6">
        {profile ? (
          <div className="card mb-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center text-2xl">{profile.display_name?.[0]}</div>
              <div>
                <h2 className="text-xl font-semibold">{profile.display_name}</h2>
                <div className="text-sm text-muted">{profile.bio}</div>
              </div>
              <div className="ml-auto">
                {user && user.id !== id && (
                  <button onClick={toggleFollow} className="px-3 py-1 rounded bg-accent/80">{following ? 'Unfollow' : 'Follow'}</button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>Loading profile...</div>
        )}

        <div>
          <h3 className="text-lg mb-2">Recent posts</h3>
          {posts.map(p => <PostCard key={p.id} post={{ ...p, author_display_name: profile?.display_name }} onAction={load} />)}
        </div>
      </main>
    </div>
  );
}
