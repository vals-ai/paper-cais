import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';

export default function PostComposer({ onPosted }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) return alert('Please log in');
    if (!content.trim()) return;
    setLoading(true);
    const { error } = await supabase.from('posts').insert([{ author: user.id, content }]);
    setLoading(false);
    if (error) return alert('Error creating post: ' + error.message);
    setContent('');
    onPosted && onPosted();
  };

  return (
    <div className="card mb-4">
      <textarea
        className="w-full bg-transparent border border-muted/20 p-3 rounded resize-none"
        rows={3}
        placeholder="What's happening? (280 chars)"
        maxLength={280}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="flex items-center justify-between mt-2">
        <div className="text-sm text-muted">{content.length}/280</div>
        <div>
          <button onClick={submit} disabled={loading} className="px-3 py-1 rounded bg-primary/80 hover:bg-primary/90">
            {loading ? 'Posting...' : 'Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
