import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, loading, signOut } = useAuth();

  return (
    <nav className="w-full bg-surface border-b border-muted/10">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-accent">Zeeter</Link>
          <Link to="/explore" className="text-sm text-muted hover:text-accent">Explore</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/notifications" className="text-sm text-muted hover:text-accent">Notifications</Link>
          {loading ? (
            <div className="text-sm text-muted">Loading...</div>
          ) : user ? (
            <>
              <Link to={`/profile/${user.id}`} className="text-sm text-muted hover:text-accent">Profile</Link>
              <button onClick={signOut} className="px-3 py-1 rounded bg-accent/80 hover:bg-accent/90">Sign out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-3 py-1 rounded bg-primary/80 hover:bg-primary/90">Log in</Link>
              <Link to="/signup" className="px-3 py-1 rounded bg-accent/80 hover:bg-accent/90">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
