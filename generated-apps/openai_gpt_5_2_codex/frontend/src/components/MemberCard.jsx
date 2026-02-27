import { Link } from 'react-router-dom'
import Button from './Button'
import Avatar from './Avatar'

const MemberCard = ({ profile, isFollowing, onFollow }) => (
  <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
    <Link to={`/profile/${profile.id}`} className="flex items-center gap-3">
      <Avatar src={profile.avatar_url} name={profile.display_name || 'Member'} size="sm" />
      <div>
        <p className="text-sm font-semibold text-foreground">
          {profile.display_name || 'Member'}
        </p>
        <p className="text-xs text-muted-foreground">View profile</p>
      </div>
    </Link>
    {onFollow && (
      <Button variant={isFollowing ? 'muted' : 'secondary'} size="sm" onClick={() => onFollow(profile.id)}>
        {isFollowing ? 'Following' : 'Follow'}
      </Button>
    )}
  </div>
)

export default MemberCard
