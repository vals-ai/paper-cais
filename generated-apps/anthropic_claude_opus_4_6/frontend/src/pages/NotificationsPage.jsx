import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, Check, CheckCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { timeAgo } from '../lib/helpers';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';

const typeIcons = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
};

const typeColors = {
  like: 'text-destructive',
  comment: 'text-primary',
  follow: 'text-success',
};

const typeMessages = {
  like: 'liked your post',
  comment: 'commented on your post',
  follow: 'started following you',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:actor_id(id, display_name, username, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  };

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-12 text-center">
          <p className="text-muted-foreground text-lg">Please sign in to view notifications</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-ghost text-sm flex items-center gap-1.5">
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner text="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-muted-foreground text-lg">No notifications yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            When people interact with your content, you'll see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Heart;
            const color = typeColors[notification.type] || 'text-muted-foreground';
            const message = typeMessages[notification.type] || 'interacted with you';

            return (
              <div
                key={notification.id}
                className={`card p-4 flex items-start gap-3 transition-all cursor-pointer hover:shadow-md ${
                  !notification.read ? 'border-l-4 border-l-primary bg-accent/30' : ''
                }`}
                onClick={() => !notification.read && markRead(notification.id)}
              >
                <div className={`p-2 rounded-full bg-secondary ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <Link
                  to={`/profile/${notification.actor?.username || notification.actor_id}`}
                  className="flex-shrink-0"
                >
                  <Avatar src={notification.actor?.avatar_url} size="sm" />
                </Link>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <Link
                      to={`/profile/${notification.actor?.username || notification.actor_id}`}
                      className="font-semibold hover:underline"
                    >
                      {notification.actor?.display_name || 'Someone'}
                    </Link>{' '}
                    {message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {timeAgo(notification.created_at)}
                  </p>
                </div>

                {!notification.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
