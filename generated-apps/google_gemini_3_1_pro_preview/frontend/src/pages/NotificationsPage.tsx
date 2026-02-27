import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Heart, MessageCircle, UserPlus, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [profile]);

  const fetchNotifications = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:profiles!actor_id(*), post:posts(*)')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50);
      
    if (data) {
      setNotifications(data);
      // Mark as read
      const unreadIds = data.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length > 0) {
        await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      }
    }
    setLoading(false);
  };

  const clearAll = async () => {
    if(!confirm('Clear all notifications?')) return;
    await supabase.from('notifications').delete().eq('user_id', profile.id);
    setNotifications([]);
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-zinc-500" /></div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-red-500 hover:text-red-600">
            <Trash2 className="h-4 w-4 mr-2" /> Clear All
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="text-center text-zinc-500 py-10">No notifications yet.</p>
      ) : (
        <div className="space-y-4 shadow-sm rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          {notifications.map((n, idx) => {
            const isLast = idx === notifications.length - 1;
            return (
              <div key={n.id} className={`p-4 flex gap-4 ${n.read ? 'opacity-80' : 'bg-blue-50/10'} ${!isLast ? 'border-b border-zinc-100 dark:border-zinc-900' : ''}`}>
                <div className="pt-1">
                  {n.type === 'like' && <Heart className="h-6 w-6 text-red-500 fill-current" />}
                  {n.type === 'comment' && <MessageCircle className="h-6 w-6 text-blue-500 fill-current" />}
                  {n.type === 'follow' && <UserPlus className="h-6 w-6 text-green-500" />}
                </div>
                <div>
                  <div className="flex items-center gap-1 flex-wrap">
                    <Link to={`/profile/${n.actor?.username}`} className="font-bold hover:underline">
                      {n.actor?.display_name || n.actor?.username}
                    </Link>
                    <span>
                      {n.type === 'like' ? 'liked your post' : n.type === 'comment' ? 'commented on your post' : 'followed you'}
                    </span>
                    <span className="text-xs text-zinc-400 ml-2">{formatDistanceToNow(new Date(n.created_at))} ago</span>
                  </div>
                  {n.post && (
                    <div className="mt-2 text-zinc-500 text-sm line-clamp-2 pl-4 border-l-2 border-zinc-200 dark:border-zinc-800">
                      {n.post.content}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
