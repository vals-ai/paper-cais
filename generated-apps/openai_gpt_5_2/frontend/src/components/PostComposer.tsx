import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabaseClient'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Textarea } from './ui/textarea'

export function PostComposer({ onPosted }: { onPosted?: () => void }) {
  const { user } = useAuth()
  const supabase = useMemo(() => getSupabaseClient(), [])

  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!user) return null

  const userId = user.id


  const remaining = 280 - content.length
  const isTooLong = remaining < 0
  const isEmpty = content.trim().length === 0

  const submitDisabled = isSubmitting || isTooLong || isEmpty

  async function submit() {
    if (submitDisabled) return

    setIsSubmitting(true)
    try {
      const payload = {
        user_id: userId,
        content: content.trim(),
      }

      const { error } = await supabase.from('posts').insert(payload)
      if (error) throw error

      setContent('')
      toast.success('Posted')
      onPosted?.()
    } catch (e) {
      console.error(e)
      toast.error('Could not post')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">Share an update</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          maxLength={560} // allow typing past 280, but show validation
        />
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            <span className={isTooLong ? 'text-destructive' : undefined}>
              {remaining}
            </span>{' '}
            characters remaining
          </div>
          <Button onClick={submit} disabled={submitDisabled}>
            {isSubmitting ? 'Posting…' : 'Post'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
