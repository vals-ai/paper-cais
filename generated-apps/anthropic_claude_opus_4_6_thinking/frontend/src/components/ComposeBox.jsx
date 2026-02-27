import { useState } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import Avatar from './Avatar';

export default function ComposeBox({ onPost }) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);

  if (!user) return null;

  const handlePost = async () => {
    if (!content.trim() || content.length > 280) return;
    setPosting(true);
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
    });
    if (!error) {
      setContent('');
      if (onPost) onPost();
    }
    setPosting(false);
  };

  const remaining = 280 - content.length;

  return (
    <div className="card p-4 mb-6">
      <div className="flex gap-3">
        <Avatar
          src={profile?.avatar_url}
          name={profile?.display_name || profile?.username}
          size="md"
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="w-full resize-none border-none bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 text-base min-h-[80px]"
            maxLength={280}
          />
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className={cn(
              'text-sm font-medium',
              remaining < 0 ? 'text-destructive' :
              remaining < 20 ? 'text-destructive/70' :
              'text-muted-foreground'
            )}>
              {remaining} characters remaining
            </span>
            <button
              onClick={handlePost}
              disabled={!content.trim() || content.length > 280 || posting}
              className="btn-primary gap-2"
            >
              <Send className="h-4 w-4" />
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
