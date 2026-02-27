import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center text-center">
      <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl">
        Welcome to <span className="text-blue-600">Zeeter</span>
      </h1>
      <p className="mt-6 max-w-lg text-lg text-zinc-600 dark:text-zinc-400">
        The simplest place to share your thoughts, connect with friends, and discover what's happening.
      </p>
      <div className="mt-10 flex gap-4">
        <Link to="/auth?mode=signup">
          <Button size="lg" className="h-12 px-8 text-base">Get Started</Button>
        </Link>
        <Link to="/auth?mode=login">
          <Button size="lg" variant="outline" className="h-12 px-8 text-base">Sign In</Button>
        </Link>
      </div>
    </div>
  );
}
