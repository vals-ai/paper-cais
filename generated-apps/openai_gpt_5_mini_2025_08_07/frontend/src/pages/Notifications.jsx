import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

export default function Notifications() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('recipient', user.id).order('created_at', { ascending: false });
    setNotes(data || []);
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-6">
        <h2 className="text-xl mb-4">Notifications</h2>
        {!user ? (
          <div className="text-muted">Please log in to view notifications.</div>
        ) : (
          notes.map(n => (
            <div key={n.id} className="card mb-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm">{n.type}</div>
                  <div className="text-xs text-muted">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                <div className="text-sm text-muted">{JSON.stringify(n.payload)}</div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
