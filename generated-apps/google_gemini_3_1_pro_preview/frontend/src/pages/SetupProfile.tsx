import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function SetupProfile() {
  const { user } = useAuth();
  
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    if (!username.match(/^[a-zA-Z0-9_]{3,20}$/)) {
      setError('Username must be 3-20 characters long and can only contain letters, numbers, and underscores.');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('profiles').insert([
      {
        id: user.id,
        username: username.toLowerCase(),
        display_name: displayName || username,
        bio,
      },
    ]);

    if (insertError) {
      if (insertError.code === '23505') {
        setError('Username is already taken.');
      } else {
        setError(insertError.message);
      }
    } else {
      window.location.href = '/'; // hard redirect to reload auth state/profile
    }
    setLoading(false);
  };

  return (
    <div className="mt-10 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Set up your profile</CardTitle>
          <CardDescription>Choose a unique username and tell us about yourself.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <div className="flex bg-zinc-100 dark:bg-zinc-900 items-center pl-3 border rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <span className="text-zinc-500">@</span>
                <Input
                  id="username"
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short bio about yourself..."
                maxLength={160}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
