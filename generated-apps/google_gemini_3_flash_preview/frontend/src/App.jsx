import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, Suspense, lazy } from 'react';
import { supabase } from './lib/supabase';

// Lazy load pages for better performance and to isolate errors
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
import Navbar from './components/Navbar';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(session);
          setLoading(false);
        }
      } catch (err) {
        console.error("Auth session fetch error:", err);
        if (mounted) setLoading(false);
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <Navbar session={session} />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Suspense fallback={<div className="text-center py-20">Loading page...</div>}>
            <Routes>
              <Route path="/" element={<Home session={session} />} />
              <Route path="/login" element={session ? <Navigate to="/" /> : <Login />} />
              <Route path="/signup" element={session ? <Navigate to="/" /> : <Signup />} />
              <Route path="/profile/:username" element={<Profile session={session} />} />
              <Route path="/notifications" element={session ? <Notifications session={session} /> : <Navigate to="/login" />} />
              <Route path="/setup" element={session ? <ProfileSetup session={session} /> : <Navigate to="/login" />} />
              <Route path="/post/:id" element={<PostDetail session={session} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </Router>
  );
}

export default App;
