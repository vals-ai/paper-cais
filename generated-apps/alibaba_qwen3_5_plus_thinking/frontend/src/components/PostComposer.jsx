import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/Button'
import { Textarea } from '../components/Textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../components/Avatar'
import { Card, CardContent } from '../components/Card'

export default function PostComposer({ onPostCreated, profile }) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const maxLength = 280

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || content.length > maxLength) return

    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: profile.id,
          content: content.trim(),
        })
        .select()
        .single()

      if (error) throw error

      setContent('')
      onPostCreated()
    } catch (err) {
      setError(err.message || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback>
                {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="What's happening?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={maxLength}
              />
              <div className="flex items-center justify-between">
                <span className={`text-sm ${content.length > maxLength * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {content.length}/{maxLength}
                </span>
                <Button type="submit" disabled={loading || !content.trim() || content.length > maxLength}>
                  {loading ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
