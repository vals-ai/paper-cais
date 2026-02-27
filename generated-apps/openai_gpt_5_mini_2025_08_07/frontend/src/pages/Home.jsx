import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import PostComposer from '../components/PostComposer';
import PostCard from '../components/PostCard';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');

  const load = async () => {
    setLoading(true);
    // fetch posts
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) {
      console.error('Load posts error', error.message);
      setLoading(false);
      return;
    }
    const posts = data || [];
    // fetch profiles
    const authorIds = [...new Set(posts.map(p => p.author))].filter(Boolean);
    const { data: profiles } = await supabase.from('profiles').select('id, display_name').in('id', authorIds);
    const map = new Map((profiles || []).map(p => [p.id, p.display_name]));
    const enriched = posts.map(p => ({ ...p, author_display_name: map.get(p.author) || p.author }));
    setPosts(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = posts.filter(p => p.content.toLowerCase().includes(query.toLowerCase()) || p.content.includes('#' + query));
  const sorted = filtered.slice().sort((a, b) => {
    if (sort === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    // trending: by likes count
    return 0; // keep order for now
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-6">
        {user && <PostComposer onPosted={load} />}

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input placeholder="Search by keyword or hashtag" value={query} onChange={e=>setQuery(e.target.value)} className="px-3 py-2 rounded bg-surface border border-muted/20" />
            <select value={sort} onChange={(e)=>setSort(e.target.value)} className="px-2 py-2 rounded bg-surface border border-muted/20">
              <option value="newest">Newest</option>
              <option value="trending">Trending</option>
            </select>
          </div>
          <div className="text-sm text-muted">{posts.length} posts</div>
        </div>

        {loading ? (
          <div className="animate-pulse">
            <div className="card h-24 mb-4" />
            <div className="card h-24 mb-4" />
          </div>
        ) : (
          sorted.map(p => <PostCard key={p.id} post={p} onAction={load} />)
        )}
      </main>
    </div>
  );
}
