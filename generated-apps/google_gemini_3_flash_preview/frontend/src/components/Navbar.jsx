import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Home, Bell, User, LogOut, Search, PlusCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

const Navbar = ({ session }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  async function fetchProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', session.user.id)
      .single();
    
    if (data) setProfile(data);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-primary tracking-tighter">Zeeter</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link to="/" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Home size={18} />
              <span>Feed</span>
            </Link>
            {session && (
              <Link to="/notifications" className="flex items-center gap-2 hover:text-primary transition-colors">
                <Bell size={18} />
                <span>Notifications</span>
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {session ? (
            <>
              <Link
                to={`/profile/${profile?.username || 'me'}`}
                className="flex items-center gap-2 hover:text-primary transition-colors"
                title="Profile"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border">
                    <User size={16} />
                  </div>
                )}
                <span className="hidden sm:inline-block font-medium">@{profile?.username}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
                Log in
              </Link>
              <Link
                to="/signup"
                className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
