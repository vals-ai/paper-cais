import { useState } from 'react'
import Textarea from './Textarea'
import Button from './Button'

const MAX_LENGTH = 280

const PostComposer = ({ onSubmit }) => {
  const [value, setValue] = useState('')
  const remaining = MAX_LENGTH - value.length

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!value.trim()) return
    await onSubmit(value.trim())
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">Share a moment</h2>
          <p className="section-subtitle">Your updates help the community stay connected.</p>
        </div>
        <span className="chip">{remaining} left</span>
      </div>
      <div className="mt-4">
        <Textarea
          rows={4}
          maxLength={MAX_LENGTH}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="What’s happening in your world?"
        />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Use #hashtags to join conversations.</p>
        <Button type="submit" disabled={!value.trim()}>
          Post update
        </Button>
      </div>
    </form>
  )
}

export default PostComposer
