import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, User, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select(`
            id,
            type,
            created_at,
            read,
            actor_id,
            post_id,
            actor:profiles!notifications_actor_id_fkey(username, full_name, avatar_url),
            post:posts!notifications_post_id_fkey(content)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error(error);
      else setNotifications(data);
      setLoading(false);
    };
    fetchNotifications();
  }, [user]);

  if (!user) return <div className="p-4 text-center">Please log in to see notifications.</div>;
  if(loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="w-full">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b p-4">
            <h1 className="text-xl font-bold">Notifications</h1>
        </div>
        <div className="divide-y pb-20 md:pb-0">
            {notifications.map(notif => (
                <div key={notif.id} className={`p-4 flex space-x-3 hover:bg-muted/10 transition-colors ${!notif.read ? 'bg-blue-50/10' : ''}`}>
                    <div className="flex-shrink-0 pt-1">
                        {notif.type === 'post_like' && <Heart className="w-6 h-6 text-red-500 fill-current" />}
                        {notif.type === 'start_following' && <User className="w-6 h-6 text-primary fill-current" />}
                        {notif.type === 'post_comment' && <MessageCircle className="w-6 h-6 text-blue-500 fill-current" />}
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                             <Link to={`/profile/${notif.actor_id}`}>
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={notif.actor?.avatar_url} />
                                    <AvatarFallback>{notif.actor?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Link>
                             <p className="text-sm">
                                <Link to={`/profile/${notif.actor_id}`} className="font-bold hover:underline mr-1">{notif.actor?.full_name}</Link>
                                <span className="text-muted-foreground text-sm">@{notif.actor?.username}</span>
                            </p>
                        </div>
                        <p className="text-sm">
                             {notif.type === 'post_like' && 'liked your post'}
                             {notif.type === 'start_following' && 'started following you'}
                             {notif.type === 'post_comment' && 'replied to your post'}
                             <span className="text-muted-foreground ml-2 text-xs">· {formatDistanceToNow(new Date(notif.created_at))} ago</span>
                        </p>
                       
                        {notif.post?.content && (
                            <Link to={`/post/${notif.post_id}`} className="block mt-2 p-3 border rounded-md text-muted-foreground text-sm bg-muted/20 hover:bg-muted/30">
                                {notif.post.content}
                            </Link>
                        )}
                    </div>
                </div>
            ))}
            {!loading && notifications.length === 0 && <p className="p-4 text-center text-muted-foreground">No notifications yet.</p>}
        </div>
    </div>
  );
}
