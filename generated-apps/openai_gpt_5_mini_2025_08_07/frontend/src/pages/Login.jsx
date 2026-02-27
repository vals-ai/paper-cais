import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return alert(error.message);
    nav('/');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <div className="max-w-md mx-auto card">
          <h2 className="text-2xl mb-4">Log in</h2>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="px-3 py-2 rounded bg-surface border border-muted/20" />
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="px-3 py-2 rounded bg-surface border border-muted/20" />
            <button className="px-3 py-2 rounded bg-primary/80" disabled={loading}>{loading? 'Signing...' : 'Sign in'}</button>
          </form>
        </div>
      </main>
    </div>
  );
}
