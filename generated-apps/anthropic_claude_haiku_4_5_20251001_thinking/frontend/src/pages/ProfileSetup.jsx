import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export const ProfileSetup = () => {
  const navigate = useNavigate()
  const { user, updateProfile } = useAuth()
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    navigate('/login')
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await updateProfile({
        bio: bio || null,
        avatar_url: avatarUrl || null,
      })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 p-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-neutral-600 mb-8">
            Add a bio and photo to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-accent-100 border border-accent-300 text-accent-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 text-neutral-900 placeholder-neutral-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed resize-none"
                rows="4"
                disabled={loading}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Optional - max 500 characters
              </p>
            </div>

            {/* Avatar URL */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Avatar URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 text-neutral-900 placeholder-neutral-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-neutral-100 disabled:cursor-not-allowed"
                disabled={loading}
              />
              <p className="text-xs text-neutral-500 mt-1">
                Optional - direct link to an image
              </p>
            </div>

            {/* Avatar Preview */}
            {avatarUrl && (
              <div className="flex justify-center">
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-full object-cover"
                  onError={() => setAvatarUrl('')}
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Complete Setup'}
            </button>

            {/* Skip Button */}
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={loading}
              className="btn-secondary w-full py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Skip for now
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
