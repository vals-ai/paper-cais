import { useState, useEffect } from 'react'
import { UserPlus, UserCheck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function FollowButton({ targetUserId, className = '' }) {
  const { user } = useAuth()
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || !targetUserId) return
    checkFollowStatus()
  }, [user, targetUserId])

  const checkFollowStatus = async () => {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle()
    setIsFollowing(!!data)
  }

  const handleToggle = async () => {
    if (!user || loading) return
    setLoading(true)
    try {
      if (isFollowing) {
        await supabase.from('follows').delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId)
        setIsFollowing(false)
      } else {
        await supabase.from('follows').insert({
          follower_id: user.id,
          following_id: targetUserId,
        })
        setIsFollowing(true)
      }
    } catch (err) {
      console.error('Follow error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.id === targetUserId) return null

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`${isFollowing ? 'btn-outline' : 'btn-primary'} btn ${className}`}
    >
      {isFollowing ? (
        <>
          <UserCheck size={16} className="mr-1.5" />
          Following
        </>
      ) : (
        <>
          <UserPlus size={16} className="mr-1.5" />
          Follow
        </>
      )}
    </button>
  )
}
