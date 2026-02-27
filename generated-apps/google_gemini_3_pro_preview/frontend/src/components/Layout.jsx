import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Home, Search, Bell, User, LogOut, PenSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Layout() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { icon: Home, label: 'Home', to: '/' },
    { icon: Search, label: 'Search', to: '/search' },
    { icon: Bell, label: 'Notifications', to: '/notifications' },
    { icon: User, label: 'Profile', to: user ? `/profile/${user.id}` : '/login' },
  ];

  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="w-full max-w-7xl flex relative">
        {/* Sidebar (Desktop) */}
        <header className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r p-4 justify-between">
            <div className="space-y-6">
                <Link to="/" className="text-2xl font-bold px-4 block text-primary">Zeeter</Link>
                <nav className="space-y-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.label}
                            to={item.to}
                            className={({ isActive }) => cn(
                                "flex items-center space-x-4 px-4 py-3 rounded-full text-lg hover:bg-secondary transition-colors",
                                isActive && "font-bold"
                            )}
                        >
                            <item.icon className="w-6 h-6" />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <Button className="w-full rounded-full text-lg py-6 mt-4">Post</Button>
            </div>
            
            {user && (
                <div className="flex items-center justify-between p-4 rounded-full hover:bg-secondary cursor-pointer">
                    <div className="flex items-center space-x-3">
                         <Avatar>
                            <AvatarImage src={user.user_metadata?.avatar_url} />
                            <AvatarFallback>{user.user_metadata?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm truncate max-w-[100px]">
                            <p className="font-bold truncate">{user.user_metadata?.full_name || 'User'}</p>
                            <p className="text-muted-foreground truncate">@{user.user_metadata?.user_name}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleSignOut}>
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            )}
            {!user && (
                 <div className="space-y-2">
                    <Button asChild className="w-full rounded-full" variant="outline">
                        <Link to="/login">Log in</Link>
                    </Button>
                    <Button asChild className="w-full rounded-full">
                         <Link to="/signup">Sign up</Link>
                    </Button>
                 </div>
            )}
        </header>

        {/* Main Content */}
        <main className="flex-1 min-w-0 border-r min-h-screen pb-16 md:pb-0">
             <Outlet />
        </main>

         {/* Right Sidebar (Desktop) - Suggestions, Search (if not on search page) */}
        <aside className="hidden lg:block w-80 p-4 sticky top-0 h-screen overflow-y-auto">
             <div className="mb-4">
                 <input 
                    type="search" 
                    placeholder="Search Zeeter" 
                    className="w-full bg-secondary rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring" 
                 />
             </div>
             <div className="bg-secondary/50 rounded-xl p-4">
                 <h2 className="font-bold text-xl mb-4">Who to follow</h2>
                 {/* Placeholder for suggestions */}
                 <div className="space-y-4">
                    <p className="text-muted-foreground text-sm">Suggestions will appear here</p>
                 </div>
             </div>
        </aside>

        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around p-3 z-50">
             {navItems.map((item) => (
                <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) => cn(
                        "p-2 rounded-full",
                         isActive ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    <item.icon className="w-6 h-6" />
                </NavLink>
             ))}
              <Button size="icon" className="rounded-full absolute -top-16 right-4 shadow-lg md:hidden">
                    <PenSquare className="w-6 h-6" />
             </Button>
        </nav>
      </div>
    </div>
  );
}
