import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Loader from './components/Loader'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider, useAuth } from './hooks/useAuth'
import HomePage from './pages/HomePage'
import AuthPage from './pages/AuthPage'
import ExplorePage from './pages/ExplorePage'
import OnboardingPage from './pages/OnboardingPage'
import SettingsPage from './pages/SettingsPage'
import NotFoundPage from './pages/NotFoundPage'

const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'))

const Layout = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <Outlet />
  </div>
)

const RouteGuard = ({ children }) => {
  const { user, profileComplete, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (user && !profileComplete && location.pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true })
    }
    if (user && profileComplete && location.pathname === '/auth') {
      navigate('/', { replace: true })
    }
  }, [user, profileComplete, loading, location.pathname, navigate])

  return children
}

const AppRoutes = () => (
  <RouteGuard>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Suspense
                fallback={
                  <div className="app-container py-10">
                    <Loader label="Loading notifications" />
                  </div>
                }
              >
                <NotificationsPage />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <Suspense
              fallback={
                <div className="app-container py-10">
                  <Loader label="Loading profile" />
                </div>
              }
            >
              <ProfilePage />
            </Suspense>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </RouteGuard>
)

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
)

export default App
