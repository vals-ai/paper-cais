import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../lib/utils'

export const Header = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profile, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <header className="border-b border-neutral-200 bg-white sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
        >
          Zeeter
        </button>

        {/* Navigation Links */}
        {user && (
          <nav className="flex items-center gap-6">
            <button
              onClick={() => navigate('/')}
              className={cn(
                'text-sm font-medium transition-colors',
                isActive('/') ? 'text-primary-600' : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              Home
            </button>
            <button
              onClick={() => navigate('/notifications')}
              className={cn(
                'text-sm font-medium transition-colors',
                isActive('/notifications') ? 'text-primary-600' : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              Notifications
            </button>
            <button
              onClick={() => navigate(`/profile/${user.id}`)}
              className={cn(
                'text-sm font-medium transition-colors',
                isActive(`/profile/${user.id}`) ? 'text-primary-600' : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              Profile
            </button>
          </nav>
        )}

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          {!user ? (
            <>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-medium bg-neutral-200 text-neutral-900 hover:bg-neutral-300 transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors cursor-pointer"
              >
                Sign Up
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-neutral-900">
                  {profile?.display_name}
                </p>
                <p className="text-xs text-neutral-500">
                  {user.email}
                </p>
              </div>
              {profile?.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-sm font-medium bg-transparent text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
