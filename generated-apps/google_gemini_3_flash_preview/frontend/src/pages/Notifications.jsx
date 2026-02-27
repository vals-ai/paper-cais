import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, MessageCircle, UserPlus, BellOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const Notifications = ({ session }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchNotifications();
      markAsRead();
    }
  }, [session]);

  async function fetchNotifications() {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(*), post:posts(*)')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (data) setNotifications(data);
    setLoading(false);
  }

  async function markAsRead() {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', session.user.id)
      .eq('read', false);
  }

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="text-red-500 fill-current" size={20} />;
      case 'comment': return <MessageCircle className="text-primary fill-current" size={20} />;
      case 'follow': return <UserPlus className="text-blue-500" size={20} />;
      default: return null;
    }
  };

  const getMessage = (notification) => {
    const actorName = notification.actor.display_name;
    switch (notification.type) {
      case 'like': return <><strong>{actorName}</strong> liked your post</>;
      case 'comment': return <><strong>{actorName}</strong> commented on your post</>;
      case 'follow': return <><strong>{actorName}</strong> followed you</>;
      default: return null;
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading notifications...</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>
      <div className="divide-y border rounded-lg bg-card overflow-hidden">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div key={notification.id} className={`p-4 hover:bg-muted/30 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}>
              <div className="flex gap-4">
                <div className="pt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Link to={`/profile/${notification.actor.username}`}>
                        <img 
                            src={notification.actor.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=placeholder'} 
                            alt={notification.actor.username} 
                            className="w-10 h-10 rounded-full object-cover" 
                        />
                    </Link>
                  </div>
                  <div>
                    <p className="text-foreground">{getMessage(notification)}</p>
                    {notification.post && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1 italic">
                        "{notification.post.content}"
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(notification.created_at))} ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-muted-foreground space-y-4">
            <BellOff size={48} className="mx-auto opacity-20" />
            <p>No notifications yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
