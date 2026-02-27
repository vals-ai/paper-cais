import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type Notification } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Heart, MessageCircle, UserPlus, ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      markAllAsRead();
    }
  }, [user]);

  async function fetchNotifications() {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!actor_id(*),
        post:posts(*)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setNotifications(data || []);
    }
    
    setLoading(false);
  }

  async function markAllAsRead() {
    if (!user) return;
    
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
  }

  function getNotificationIcon(type: string) {
    switch (type) {
      case 'like':
        return <Heart className="h-5 w-5 text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-blue-500 fill-blue-500" />;
      case 'follow':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      default:
        return null;
    }
  }

  function getNotificationText(notification: Notification) {
    const actorName = notification.actor?.display_name || notification.actor?.username;
    
    switch (notification.type) {
      case 'like':
        return (
          <span>
            <span className="font-semibold">{actorName}</span> liked your post
          </span>
        );
      case 'comment':
        return (
          <span>
            <span className="font-semibold">{actorName}</span> commented on your post
          </span>
        );
      case 'follow':
        return (
          <span>
            <span className="font-semibold">{actorName}</span> started following you
          </span>
        );
      default:
        return null;
    }
  }

  function getNotificationLink(notification: Notification) {
    switch (notification.type) {
      case 'like':
      case 'comment':
        return `/post/${notification.post_id}`;
      case 'follow':
        return `/profile/${notification.actor?.username}`;
      default:
        return '#';
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Sign in to view notifications</h1>
        <Button onClick={() => navigate('/auth')}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b z-10">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="md:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Notifications</h1>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="w-full rounded-none bg-transparent border-b">
          <TabsTrigger 
            value="all" 
            className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            All
          </TabsTrigger>
          <TabsTrigger 
            value="mentions"
            className="flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
          >
            Mentions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {loading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={getNotificationLink(notification)}
                  className={`flex items-start gap-3 p-4 hover:bg-accent/50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <Avatar className="h-10 w-10 mb-2">
                      <AvatarImage src={notification.actor?.avatar_url || undefined} />
                      <AvatarFallback>
                        {notification.actor?.display_name?.[0] || notification.actor?.username?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm">{getNotificationText(notification)}</p>
                    <p className="text-muted-foreground text-sm mt-1">{formatDate(notification.created_at)}</p>
                    {notification.post && (
                      <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                        {notification.post.content}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mentions" className="mt-0">
          <div className="p-8 text-center text-muted-foreground">
            <p>Mentions will appear here</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}