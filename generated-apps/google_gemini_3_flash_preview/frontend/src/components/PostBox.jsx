import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { PlusCircle } from 'lucide-react';

const PostBox = ({ session, onPostCreated }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || content.length > 280) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .insert([
        { content, user_id: session.user.id }
      ])
      .select();

    if (!error) {
      setContent('');
      if (onPostCreated) onPostCreated(data[0]);
    }
    setLoading(false);
  };

  if (!session) return null;

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full min-h-[100px] bg-transparent border-none focus:ring-0 text-lg resize-none placeholder:text-muted-foreground"
            placeholder="What's happening?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
          />
          <div className="flex items-center justify-between border-t pt-4">
            <div className={`text-sm ${content.length > 280 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {content.length}/280
            </div>
            <Button
              type="submit"
              disabled={loading || !content.trim() || content.length > 280}
              className="rounded-full px-6"
            >
              Post
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PostBox;
