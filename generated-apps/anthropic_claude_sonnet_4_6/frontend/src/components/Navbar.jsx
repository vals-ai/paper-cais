import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Home, Bell, Search, User, LogOut, Zap } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Avatar from './Avatar'

export default function Navbar({ unreadCount = 0 }) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary hover:text-primary/80 transition-colors">
          <Zap size={24} className="text-primary" fill="currentColor" />
          <span>Zeeter</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${isActive('/') ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
          >
            <Home size={18} />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <Link
            to="/search"
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
              ${isActive('/search') ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
          >
            <Search size={18} />
            <span className="hidden sm:inline">Explore</span>
          </Link>

          {user && (
            <Link
              to="/notifications"
              className={`relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive('/notifications') ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="hidden sm:inline">Alerts</span>
            </Link>
          )}
        </nav>

        {/* User actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                to={`/profile/${profile?.username}`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
              >
                <Avatar src={profile?.avatar_url} size="sm" />
                <span className="hidden sm:inline text-sm font-medium text-foreground">
                  {profile?.display_name || profile?.username}
                </span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Sign out"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn-ghost btn-sm btn text-muted-foreground">Sign in</Link>
              <Link to="/signup" className="btn-primary btn-sm btn">Join</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
