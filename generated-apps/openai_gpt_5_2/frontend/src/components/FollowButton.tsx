import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabaseClient'
import { Button } from './ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'

export function FollowButton({
  targetUserId,
  initialFollowing,
  onChange,
}: {
  targetUserId: string
  initialFollowing: boolean
  onChange?: (next: boolean) => void
}) {
  const supabase = useMemo(() => getSupabaseClient(), [])
  const { user } = useAuth()

  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [isWorking, setIsWorking] = useState(false)


  useEffect(() => {
    setIsFollowing(initialFollowing)
  }, [initialFollowing, targetUserId])

  if (user?.id === targetUserId) return null

  async function follow() {
    if (!user) return
    setIsWorking(true)
    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, followee_id: targetUserId })

      if (error) throw error

      setIsFollowing(true)
      onChange?.(true)
    } catch (e) {
      console.error(e)
      toast.error('Could not follow')
    } finally {
      setIsWorking(false)
    }
  }

  async function unfollow() {
    if (!user) return
    setIsWorking(true)
    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followee_id', targetUserId)

      if (error) throw error

      setIsFollowing(false)
      onChange?.(false)
    } catch (e) {
      console.error(e)
      toast.error('Could not unfollow')
    } finally {
      setIsWorking(false)
    }
  }

  if (!user) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button variant="secondary" disabled>
              Follow
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>Sign in to follow</TooltipContent>
      </Tooltip>
    )
  }

  return isFollowing ? (
    <Button variant="outline" onClick={unfollow} disabled={isWorking}>
      {isWorking ? 'Working…' : 'Following'}
    </Button>
  ) : (
    <Button onClick={follow} disabled={isWorking}>
      {isWorking ? 'Working…' : 'Follow'}
    </Button>
  )
}
