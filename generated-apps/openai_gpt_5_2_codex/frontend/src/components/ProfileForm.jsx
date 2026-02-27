import { useEffect, useState } from 'react'
import Avatar from './Avatar'
import Button from './Button'
import Input from './Input'
import Textarea from './Textarea'

const ProfileForm = ({ profile, onSave, submitLabel = 'Save profile' }) => {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setDisplayName(profile?.display_name || '')
    setBio(profile?.bio || '')
    setAvatarPreview(profile?.avatar_url || '')
  }, [profile])

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!displayName.trim()) return
    setLoading(true)
    await onSave({ displayName: displayName.trim(), bio: bio.trim(), avatarFile })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="surface-muted flex items-center gap-4 p-4">
        <Avatar src={avatarPreview} name={displayName || 'Member'} size="lg" />
        <div>
          <p className="text-sm font-semibold text-foreground">Profile photo</p>
          <p className="text-xs text-muted-foreground">Upload a square image for best results.</p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-3 block text-xs text-muted-foreground"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Display name
        </label>
        <Input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Your name"
          required
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Bio
        </label>
        <Textarea
          rows={4}
          maxLength={280}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Share a little about yourself"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{280 - bio.length} characters left</p>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}

export default ProfileForm
