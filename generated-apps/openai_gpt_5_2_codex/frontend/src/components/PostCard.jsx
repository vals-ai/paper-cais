import { useState } from 'react'
import { Heart, Pencil, Trash2 } from 'lucide-react'
import Avatar from './Avatar'
import Button from './Button'
import Textarea from './Textarea'
import CommentThread from './CommentThread'

const PostCard = ({ post, currentUser, onLikeToggle, onDelete, onUpdate, onCommentAdded }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(post.content)
  const isOwner = currentUser?.id === post.author_id

  const handleSave = async () => {
    if (!draft.trim() || draft.trim() === post.content) {
      setEditing(false)
      setDraft(post.content)
      return
    }
    await onUpdate(post.id, draft.trim())
    setEditing(false)
  }

  return (
    <article className="surface-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Avatar src={post.author?.avatar_url} name={post.author?.display_name || 'Member'} />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {post.author?.display_name || 'Member'}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(post.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing((prev) => !prev)}
            >
              <Pencil className="h-4 w-4" />
              {editing ? 'Cancel' : 'Edit'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(post.id)}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4">
        {editing ? (
          <div className="space-y-3">
            <Textarea
              rows={4}
              maxLength={280}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{280 - draft.length} characters left</span>
              <Button size="sm" onClick={handleSave}>
                Save update
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => onLikeToggle(post)}
          className={`flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-semibold transition ${
            post.isLiked ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/70'
          }`}
          disabled={!currentUser}
        >
          <Heart className="h-3.5 w-3.5" />
          {post.likeCount} likes
        </button>
        <span className="text-xs text-muted-foreground">{post.commentCount} comments</span>
      </div>

      <CommentThread
        postId={post.id}
        currentUser={currentUser}
        onCommentAdded={() => onCommentAdded(post.id)}
      />
    </article>
  )
}

export default PostCard
