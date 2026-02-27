import { useState, useEffect } from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

export default function FollowButton({ targetUserId, currentUserId, onFollowChange }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId || !targetUserId) return;
    checkFollow();
  }, [currentUserId, targetUserId]);

  const checkFollow = async () => {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentUserId)
      .eq('following_id', targetUserId)
      .maybeSingle();
    setIsFollowing(!!data);
    setLoading(false);
  };

  const toggleFollow = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId);
        setIsFollowing(false);
      } else {
        await supabase.from('follows').insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });
        // Create follow notification
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          actor_id: currentUserId,
          type: 'follow',
        });
        setIsFollowing(true);
      }
      if (onFollowChange) onFollowChange();
    } catch (err) {
      console.error('Follow error:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return <button className="btn-outline opacity-50" disabled>...</button>;
  }

  return (
    <button
      onClick={toggleFollow}
      className={cn(
        'gap-2 text-sm whitespace-nowrap',
        isFollowing ? 'btn-outline' : 'btn-primary'
      )}
      disabled={loading}
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4" />
          Follow
        </>
      )}
    </button>
  );
}
