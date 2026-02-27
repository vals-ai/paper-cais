import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/Button'
import Input from '../components/Input'
import { useAuth } from '../hooks/useAuth'

const AuthPage = () => {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const { signIn, signUp, authError } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage(null)
    setLoading(true)
    const action = mode === 'signin' ? signIn : signUp
    try {
      const { error } = await action({ email, password })
      if (error) {
        setMessage(error.message || 'Authentication failed. Please try again.')
      } else {
        navigate(mode === 'signin' ? '/' : '/onboarding')
      }
    } catch (error) {
      setMessage(error?.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const displayedMessage = message || authError

  return (
    <div className="min-h-screen bg-background">
      <div className="app-container grid gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-center gap-6">
          <span className="chip w-fit">Welcome to Zeeter</span>
          <h1 className="text-4xl font-semibold leading-tight text-foreground">
            Share quick updates, follow fresh perspectives, and stay in the loop.
          </h1>
          <p className="text-base text-muted-foreground">
            Build your profile, post short updates, and track notifications in one streamlined social space.
          </p>
          <div className="surface-muted grid gap-4 p-6">
            <div>
              <p className="text-sm font-semibold text-foreground">Why members love Zeeter</p>
              <p className="text-sm text-muted-foreground">
                A personalized feed blends content from the people you follow with trending community updates.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Stay up to date</p>
              <p className="text-sm text-muted-foreground">
                Notifications keep you informed about likes, comments, and new followers.
              </p>
            </div>
          </div>
        </section>

        <section className="surface-card p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {mode === 'signin' ? 'Sign in to Zeeter' : 'Create your account'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === 'signin'
                  ? 'Welcome back! Let’s continue the conversation.'
                  : 'Join the community and start sharing today.'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === 'signin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === 'signup' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Email address
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Password
              </label>
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
              />
            </div>
            {displayedMessage && <p className="text-sm text-warning">{displayedMessage}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Working...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to use Zeeter responsibly and keep the community supportive.
            </p>
          </form>
        </section>
      </div>
    </div>
  )
}

export default AuthPage
