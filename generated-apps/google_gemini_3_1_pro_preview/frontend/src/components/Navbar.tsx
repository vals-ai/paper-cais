import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/button';
import { Home, Bell, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (!profile?.username) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-zinc-950 sm:sticky sm:top-0 sm:border-b sm:border-t-0">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-bold tracking-tighter">
          Zeeter
        </Link>
        <div className="flex items-center gap-1 sm:gap-4">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/notifications">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
          </Link>
          <Link to={`/profile/${profile.username}`}>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
