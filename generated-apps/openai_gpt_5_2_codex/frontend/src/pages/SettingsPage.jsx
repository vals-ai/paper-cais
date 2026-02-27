import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../hooks/useAuth'
import ProfileForm from '../components/ProfileForm'

const SettingsPage = () => {
  const { user, profile, refreshProfile } = useAuth()
  const [errorMessage, setErrorMessage] = useState('')

  const handleSave = async ({ displayName, bio, avatarFile }) => {
    setErrorMessage('')
    let avatarUrl = profile?.avatar_url || ''

    try {
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const filePath = `${user.id}/${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile, { upsert: true })

        if (uploadError) {
          setErrorMessage('Unable to upload your profile image right now.')
          return
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        avatarUrl = data.publicUrl
      }

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: displayName,
        bio,
        avatar_url: avatarUrl
      })

      if (error) {
        setErrorMessage('Unable to save your profile right now.')
        return
      }

      await refreshProfile()
    } catch (error) {
      setErrorMessage('Unable to save your profile right now.')
    }
  }

  return (
    <div className="app-container py-10">
      <div className="surface-card p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-foreground">Profile settings</h1>
          <p className="text-sm text-muted-foreground">
            Keep your profile details and avatar up to date.
          </p>
        </div>
        {errorMessage && (
          <div className="surface-muted mb-4 px-4 py-3 text-sm text-warning">
            {errorMessage}
          </div>
        )}
        <ProfileForm profile={profile} onSave={handleSave} submitLabel="Save changes" />
      </div>
    </div>
  )
}

export default SettingsPage
