import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import Avatar from './Avatar'

export default function PostComposer({ onPost }) {
  const { profile } = useAuth()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const maxChars = 280

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() || content.length > maxChars || loading) return
    setLoading(true)
    try {
      await onPost(content.trim())
      setContent('')
    } finally {
      setLoading(false)
    }
  }

  const remaining = maxChars - content.length
  const isOverLimit = remaining < 0
  const isNearLimit = remaining <= 20 && remaining >= 0

  return (
    <div className="card p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Avatar src={profile?.avatar_url} size="md" />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="What's happening?"
              rows={3}
              className="textarea w-full text-base placeholder:text-muted-foreground/60 border-none focus-visible:ring-0 p-0 resize-none bg-transparent"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                {content.length > 0 && (
                  <div className={`flex items-center gap-1.5 text-sm ${isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                    <svg viewBox="0 0 36 36" className="w-6 h-6 rotate-[-90deg]">
                      <circle
                        cx="18" cy="18" r="15"
                        fill="none"
                        stroke="currentColor"
                        strokeOpacity="0.2"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18" cy="18" r="15"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${Math.min((content.length / maxChars) * 94.2, 94.2)} 94.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    {remaining <= 20 && (
                      <span className="font-medium text-xs">{remaining}</span>
                    )}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!content.trim() || isOverLimit || loading}
                className="btn-primary btn"
              >
                {loading ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
