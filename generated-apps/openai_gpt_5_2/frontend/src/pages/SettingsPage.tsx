import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabaseClient'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

function initialsFrom(str: string) {
  const parts = str.trim().split(/\s+/g).filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function SettingsPage() {
  const supabase = useMemo(() => getSupabaseClient(), [])
  const { user, profile, refreshProfile } = useAuth()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '')
    setBio(profile?.bio ?? '')
    setAvatarPreview(profile?.avatar_url ?? null)
  }, [profile?.display_name, profile?.bio, profile?.avatar_url])

  useEffect(() => {
    if (!avatarFile) return
    const url = URL.createObjectURL(avatarFile)
    setAvatarPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const userId = user.id


  const label = displayName.trim() || user.email || 'Member'
  const initials = initialsFrom(label)

  async function save() {
    const name = displayName.trim()
    if (!name) {
      toast.error('Display name is required')
      return
    }

    setIsSaving(true)
    try {
      let avatarUrl = profile?.avatar_url ?? null

      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'png'
        const path = `${userId}/avatar-${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, {
            upsert: true,
            contentType: avatarFile.type,
          })

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = data.publicUrl
      }

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: name, bio: bio.trim(), avatar_url: avatarUrl })
        .eq('user_id', userId)

      if (error) throw error

      await refreshProfile()
      toast.success('Settings saved')
      setAvatarFile(null)
    } catch (e) {
      console.error(e)
      toast.error('Could not save settings')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile settings</CardTitle>
        <CardDescription>Update your display name, bio, and profile image.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarPreview ?? undefined} alt={label} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Label htmlFor="avatar">Profile image</Label>
            <div className="flex items-center gap-2">
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  setAvatarFile(f)
                }}
              />
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setAvatarFile(null)
                  setAvatarPreview(null)
                }}
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="display">Display name</Label>
            <Input
              id="display"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Input id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" onClick={save} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
