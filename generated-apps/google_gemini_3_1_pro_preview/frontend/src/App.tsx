import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import HomeFeed from './pages/HomeFeed';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import SetupProfile from './pages/SetupProfile';
import Navbar from './components/Navbar';
import { Loader2 } from 'lucide-react';

function App() {
  const { session, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      {session && <Navbar />}
      <main className="mx-auto max-w-2xl px-4 pb-20 pt-6 sm:pb-6">
        <Routes>
          {!session ? (
            <>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : (
            <>
              {!profile?.username ? (
                <Route path="*" element={<SetupProfile />} />
              ) : (
                <>
                  <Route path="/" element={<HomeFeed />} />
                  <Route path="/profile/:username" element={<ProfilePage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </>
              )}
            </>
          )}
        </Routes>
      </main>
    </div>
  );
}

export default App;
