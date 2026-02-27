import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      return alert(error.message);
    }
    // sign in
    const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
    if (signError) {
      setLoading(false);
      return alert(signError.message);
    }
    // create profile
    const user = (await supabase.auth.getUser()).data.user;
    if (user) {
      const profile = { id: user.id, username: email.split('@')[0], display_name: displayName || email.split('@')[0] };
      const { error: pErr } = await supabase.from('profiles').upsert(profile, { onConflict: 'id' });
      if (pErr) console.error('Profile error', pErr.message);
    }
    setLoading(false);
    nav('/');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <div className="max-w-md mx-auto card">
          <h2 className="text-2xl mb-4">Sign up</h2>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Display name" className="px-3 py-2 rounded bg-surface border border-muted/20" />
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="px-3 py-2 rounded bg-surface border border-muted/20" />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="px-3 py-2 rounded bg-surface border border-muted/20" />
            <button className="px-3 py-2 rounded bg-accent/80" disabled={loading}>{loading? 'Creating...' : 'Create account'}</button>
          </form>
        </div>
      </main>
    </div>
  );
}
