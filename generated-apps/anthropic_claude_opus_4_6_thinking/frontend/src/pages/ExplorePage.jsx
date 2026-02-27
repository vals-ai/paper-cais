import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import UserCard from '../components/UserCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Search, Users } from 'lucide-react';

export default function ExplorePage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  const fetchUsers = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*');

    if (searchQuery.trim()) {
      query = query.or(`username.ilike.%${searchQuery.trim()}%,display_name.ilike.%${searchQuery.trim()}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

    if (!error) {
      setUsers(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Discover People</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username or display name..."
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {searchQuery ? 'No users found matching your search' : 'No users found'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(profile => (
            <UserCard
              key={profile.id}
              profile={profile}
              currentUserId={user?.id}
              onFollowChange={fetchUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
}
