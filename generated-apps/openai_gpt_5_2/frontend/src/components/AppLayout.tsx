import type { ReactNode } from 'react'
import { Bell, Compass, Home } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { cn } from '../lib/cn'
import { ThemeToggle } from './ThemeToggle'
import { UserMenu } from './UserMenu'
import { Button } from './ui/button'
import { TooltipProvider } from './ui/tooltip'
import { FullPageLoader } from './FullPageLoader'

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-brand-gradient" />
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight">Zeeter</div>
        <div className="text-xs text-muted-foreground">Social updates</div>
      </div>
    </div>
  )
}

function NavItem({
  to,
  icon,
  label,
}: {
  to: string
  icon: ReactNode
  label: string
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
          isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
        )
      }
    >
      <span className="text-muted-foreground">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isReady, user, isOnboarded, isProfileLoading } = useAuth()

  if (!isReady) return <FullPageLoader label="Starting…" />

  if (user && !isProfileLoading && !isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Go to home"
            >
              <Brand />
            </button>

            <nav className="hidden items-center gap-2 md:flex">
              <NavItem to="/" icon={<Home className="h-4 w-4" />} label="Home" />
              <NavItem
                to="/discover"
                icon={<Compass className="h-4 w-4" />}
                label="Discover"
              />
              {user ? (
                <NavItem
                  to="/notifications"
                  icon={<Bell className="h-4 w-4" />}
                  label="Notifications"
                />
              ) : null}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              {!user ? (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    Sign in
                  </Button>
                  <Button onClick={() => navigate('/login?tab=signup')}>Create account</Button>
                </>
              ) : (
                <UserMenu />
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="grid grid-cols-12 gap-6">
            <aside className="col-span-3 hidden md:block">
              <div className="space-y-2 rounded-lg border border-border/60 bg-card p-4 shadow-soft">
                <div className="text-xs font-semibold text-muted-foreground">Navigate</div>
                <div className="flex flex-col gap-1">
                  <NavItem to="/" icon={<Home className="h-4 w-4" />} label="Home" />
                  <NavItem
                    to="/discover"
                    icon={<Compass className="h-4 w-4" />}
                    label="Discover"
                  />
                  {user ? (
                    <NavItem
                      to="/notifications"
                      icon={<Bell className="h-4 w-4" />}
                      label="Notifications"
                    />
                  ) : null}
                </div>
              </div>
            </aside>

            <main className="col-span-12 md:col-span-6">
              <Outlet />
            </main>

            <aside className="col-span-3 hidden md:block">
              <div className="space-y-4 rounded-lg border border-border/60 bg-card p-4 shadow-soft">
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Tips</div>
                  <div className="text-sm text-muted-foreground">
                    Use hashtags to make posts discoverable. Try searching for{' '}
                    <span className="font-medium text-foreground">#welcome</span>.
                  </div>
                </div>
                <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  Visitors can browse posts and profiles. Sign in to follow, like, or comment.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
