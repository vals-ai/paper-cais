import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import Avatar from './Avatar'
import Button from './Button'
import Textarea from './Textarea'
import Loader from './Loader'

const CommentThread = ({ postId, currentUser, onCommentAdded }) => {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(false)
  const [draft, setDraft] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const loadComments = async () => {
    setLoading(true)
    setErrorMessage('')
    const { data, error } = await supabase
      .from('comments')
      .select('id, content, created_at, author_id, profiles:author_id(display_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      setErrorMessage('Unable to load comments right now.')
    } else {
      setComments(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) {
      loadComments()
    }
  }, [open])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!draft.trim()) return
    setErrorMessage('')
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: currentUser.id,
        content: draft.trim()
      })
      .select('id, content, created_at, author_id, profiles:author_id(display_name, avatar_url)')
      .single()

    if (error) {
      setErrorMessage('Unable to post your comment right now.')
      return
    }

    if (data) {
      setComments((prev) => [...prev, data])
      setDraft('')
      onCommentAdded()
    }
  }

  return (
    <div className="mt-4 border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <MessageSquare className="h-4 w-4" />
        {open ? 'Hide' : 'View'} comments
      </button>

      {open && (
        <div className="mt-4 space-y-4">
          {errorMessage && (
            <div className="surface-muted p-3 text-sm text-warning">{errorMessage}</div>
          )}
          {loading ? (
            <div className="surface-muted p-4">
              <Loader label="Loading comments" />
            </div>
          ) : comments.length ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar src={comment.profiles?.avatar_url} name={comment.profiles?.display_name || 'Member'} size="sm" />
                <div className="surface-muted flex-1 px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {comment.profiles?.display_name || 'Member'}
                    </span>
                    <span>{new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{comment.content}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="surface-muted p-4 text-sm text-muted-foreground">
              Start the conversation with a comment.
            </div>
          )}

          {currentUser && (
            <form onSubmit={handleSubmit} className="surface-card p-4">
              <Textarea
                rows={3}
                maxLength={280}
                placeholder="Write a thoughtful reply."
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{280 - draft.length} characters left</span>
                <Button type="submit" size="sm" disabled={!draft.trim()}>
                  Post comment
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default CommentThread
