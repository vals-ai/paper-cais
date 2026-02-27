import { NavLink, useNavigate } from 'react-router-dom'
import { Bell, LogOut, UserRound } from 'lucide-react'
import Button from './Button'
import Avatar from './Avatar'
import { useAuth } from '../hooks/useAuth'

const NavItem = ({ to, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `rounded-full px-4 py-2 text-sm font-semibold transition ${
        isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted'
      }`
    }
  >
    {label}
  </NavLink>
)

const Navbar = () => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur">
      <div className="app-container flex items-center justify-between py-4">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="text-lg font-semibold text-foreground">
            Zeeter
          </NavLink>
          <nav className="hidden items-center gap-2 md:flex">
            <NavItem to="/" label="Home" />
            <NavItem to="/explore" label="Explore" />
            {user && <NavItem to="/notifications" label="Notifications" />}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <NavLink
                to="/notifications"
                className="hidden rounded-full border border-border bg-muted p-2 text-foreground transition hover:bg-muted/70 md:inline-flex"
              >
                <Bell className="h-4 w-4" />
              </NavLink>
              <NavLink
                to={profile?.id ? `/profile/${profile.id}` : '/'}
                className="hidden items-center gap-2 rounded-full border border-border bg-muted px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted/70 md:inline-flex"
              >
                <Avatar src={profile?.avatar_url} name={profile?.display_name || 'Member'} size="sm" />
                <span>{profile?.display_name || 'Profile'}</span>
              </NavLink>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="rounded-full">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </>
          ) : (
            <>
              <NavLink
                to="/auth"
                className="rounded-full px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Sign in
              </NavLink>
              <Button onClick={() => navigate('/auth')}>
                <UserRound className="h-4 w-4" />
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar
