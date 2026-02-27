import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export default function Explore() {
  const [profiles, setProfiles] = useState([]);
  const { user } = useAuth();

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').limit(100);
    setProfiles(data || []);
  };

  useEffect(() => { load(); }, []);

  const follow = async (id) => {
    if (!user) return alert('Please log in');
    await supabase.from('follows').insert([{ follower: user.id, following: id }]);
    await supabase.from('notifications').insert([{ recipient: id, type: 'follow', payload: { follower: user.id } }]);
    alert('Followed');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-6">
        <h2 className="text-xl mb-4">Discover members</h2>
        <div className="grid grid-cols-3 gap-4">
          {profiles.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center">{p.display_name?.[0]}</div>
                <div>
                  <Link to={`/profile/${p.id}`} className="font-semibold">{p.display_name}</Link>
                  <div className="text-sm text-muted">{p.bio}</div>
                </div>
              </div>
              <div className="mt-3">
                {user && user.id !== p.id && <button onClick={()=>follow(p.id)} className="px-3 py-1 rounded bg-accent/80">Follow</button>}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
