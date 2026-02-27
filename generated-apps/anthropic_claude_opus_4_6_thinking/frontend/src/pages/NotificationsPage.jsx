import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import Avatar from '../components/Avatar';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDate } from '../lib/utils';
import { Bell, Heart, MessageCircle, UserPlus, Check, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:actor_id(id, username, display_name, avatar_url),
        post:post_id(id, content)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error) {
      setNotifications(data || []);
    }
    setLoading(false);
  };

  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const getIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="h-5 w-5 text-destructive" />;
      case 'comment': return <MessageCircle className="h-5 w-5 text-primary" />;
      case 'follow': return <UserPlus className="h-5 w-5 text-success" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getMessage = (notification) => {
    const actorName = notification.actor?.display_name || notification.actor?.username || 'Someone';
    switch (notification.type) {
      case 'like':
        return <><span className="font-semibold text-foreground">{actorName}</span> liked your post</>;
      case 'comment':
        return <><span className="font-semibold text-foreground">{actorName}</span> commented on your post</>;
      case 'follow':
        return <><span className="font-semibold text-foreground">{actorName}</span> started following you</>;
      default:
        return <><span className="font-semibold text-foreground">{actorName}</span> interacted with you</>;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <span className="badge bg-primary/10 text-primary">{unreadCount} new</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-ghost text-sm gap-1.5">
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground text-lg">No notifications yet</p>
          <p className="text-muted-foreground text-sm mt-1">When someone interacts with you, you'll see it here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`card p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                !notification.read ? 'bg-primary/5 border-primary/20' : ''
              }`}
              onClick={() => {
                markRead(notification.id);
                if (notification.type === 'follow' && notification.actor?.username) {
                  navigate(`/profile/${notification.actor.username}`);
                }
              }}
            >
              <div className="mt-0.5">{getIcon(notification.type)}</div>

              <Link to={`/profile/${notification.actor?.username}`}>
                <Avatar
                  src={notification.actor?.avatar_url}
                  name={notification.actor?.display_name || notification.actor?.username}
                  size="sm"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">
                  {getMessage(notification)}
                </p>
                {notification.post?.content && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    "{notification.post.content}"
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(notification.created_at)}
                </p>
              </div>

              {!notification.read && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
