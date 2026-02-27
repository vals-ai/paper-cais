import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Bell, User, Search, LogOut, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function Layout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Subscribe to new notifications
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  async function fetchUnreadCount() {
    if (!user) return;
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setUnreadCount(count || 0);
  }

  async function handleSignOut() {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
    navigate('/auth');
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/', auth: false },
    { icon: Search, label: 'Search', path: '/search', auth: false },
    { icon: Bell, label: 'Notifications', path: '/notifications', auth: true, badge: unreadCount },
    { icon: User, label: 'Profile', path: `/profile/${profile?.username || ''}`, auth: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl flex">
        {/* Sidebar */}
        <aside className="w-64 sticky top-0 h-screen border-r p-4 hidden md:flex flex-col">
          <Link to="/" className="flex items-center gap-2 p-4 mb-4">
            <Zap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">Zeeter</span>
          </Link>
          
          <nav className="space-y-2 flex-1">
            {navItems.map((item) => {
              if (item.auth && !user) return null;
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'hover:bg-accent'
                  }`}
                >
                  <div className="relative">
                    <Icon className="h-6 w-6" />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-lg">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          
          {user ? (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-3 p-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>{profile?.display_name?.[0] || profile?.username?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{profile?.display_name || profile?.username}</p>
                  <p className="text-sm text-muted-foreground truncate">@{profile?.username}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-t pt-4 mt-4 space-y-2">
              <Button className="w-full" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            </div>
          )}
        </aside>

        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t z-50">
          <nav className="flex justify-around p-2">
            {navItems.map((item) => {
              if (item.auth && !user) return null;
              const Icon = item.icon;
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`p-2 rounded-lg relative ${isActive ? 'text-primary' : ''}`}
                >
                  <Icon className="h-6 w-6" />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 min-h-screen border-r">
          <Outlet />
        </main>
      </div>
    </div>
  );
}