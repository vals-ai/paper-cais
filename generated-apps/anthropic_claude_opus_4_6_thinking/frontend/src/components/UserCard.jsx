import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import FollowButton from './FollowButton';

export default function UserCard({ profile, currentUserId, onFollowChange }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <Link to={`/profile/${profile.username}`}>
        <Avatar
          src={profile.avatar_url}
          name={profile.display_name || profile.username}
          size="md"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${profile.username}`}
          className="font-semibold text-foreground hover:text-primary transition-colors block truncate"
        >
          {profile.display_name || profile.username}
        </Link>
        <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
        {profile.bio && (
          <p className="text-sm text-foreground mt-1 line-clamp-2">{profile.bio}</p>
        )}
      </div>
      {currentUserId && currentUserId !== profile.id && (
        <FollowButton
          targetUserId={profile.id}
          currentUserId={currentUserId}
          onFollowChange={onFollowChange}
        />
      )}
    </div>
  );
}
