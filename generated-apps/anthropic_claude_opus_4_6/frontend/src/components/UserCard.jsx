import { Link } from 'react-router-dom';
import { UserPlus, UserMinus } from 'lucide-react';
import Avatar from './Avatar';

export default function UserCard({ profile, isFollowing, onToggleFollow, currentUserId }) {
  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="card p-4 flex items-center gap-3 animate-fade-in hover:shadow-md transition-shadow">
      <Link to={`/profile/${profile.username || profile.id}`}>
        <Avatar src={profile.avatar_url} size="md" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${profile.username || profile.id}`}
          className="font-semibold text-foreground hover:underline truncate block"
        >
          {profile.display_name || 'Unknown'}
        </Link>
        <p className="text-sm text-muted-foreground truncate">@{profile.username || 'unknown'}</p>
        {profile.bio && (
          <p className="text-sm text-foreground mt-1 line-clamp-2">{profile.bio}</p>
        )}
      </div>
      {!isOwnProfile && currentUserId && (
        <button
          onClick={() => onToggleFollow?.(profile.id)}
          className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium transition-all ${
            isFollowing
              ? 'btn-outline'
              : 'btn-primary'
          }`}
        >
          {isFollowing ? (
            <>
              <UserMinus className="w-4 h-4" />
              <span>Unfollow</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Follow</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
