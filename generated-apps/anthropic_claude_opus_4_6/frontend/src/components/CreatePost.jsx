import { useState } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Avatar from './Avatar';

export default function CreatePost({ onPostCreated }) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    
    setError('');
    setSubmitting(true);

    const { data, error: err } = await supabase
      .from('posts')
      .insert({ content: content.trim(), user_id: user.id })
      .select('*, profiles:user_id(id, display_name, username, avatar_url)')
      .single();

    if (err) {
      setError(err.message);
    } else {
      setContent('');
      onPostCreated?.(data);
    }
    setSubmitting(false);
  };

  const remaining = 280 - content.length;

  return (
    <div className="card p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Avatar src={profile?.avatar_url} size="md" />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening?"
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none focus:outline-none text-base border-none p-0"
              rows={3}
              maxLength={280}
            />
          </div>
        </div>

        {error && (
          <p className="text-destructive text-sm mt-2">{error}</p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <div
              className={`text-sm font-medium transition-colors ${
                remaining < 0 ? 'text-destructive' : remaining < 20 ? 'text-yellow-500' : 'text-muted-foreground'
              }`}
            >
              {remaining}
            </div>
            {remaining < 280 && (
              <div className="w-8 h-8 relative">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                  <circle
                    cx="16" cy="16" r="14"
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="16" cy="16" r="14"
                    fill="none"
                    stroke={remaining < 0 ? 'var(--color-destructive)' : remaining < 20 ? '#eab308' : 'var(--color-primary)'}
                    strokeWidth="2.5"
                    strokeDasharray={`${Math.max(0, ((280 - remaining) / 280) * 88)} 88`}
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!content.trim() || content.length > 280 || submitting}
            className="btn-primary flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Posting...' : 'Post'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
