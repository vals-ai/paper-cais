import { useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { getSupabaseClient } from '../lib/supabaseClient'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  if (typeof e === 'string') return e
  return 'Something went wrong'
}


export function AuthPage() {
  const supabase = useMemo(() => getSupabaseClient(), [])
  const { user } = useAuth()
  const [params] = useSearchParams()

  const initialTab = params.get('tab') === 'signup' ? 'signup' : 'signin'
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isWorking, setIsWorking] = useState(false)

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  if (user) {
    return <Navigate to="/" replace />
  }

  async function signIn() {
    setIsWorking(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      toast.success('Welcome back')
    } catch (e: unknown) {
      console.error(e)
      toast.error(errorMessage(e) || 'Could not sign in')
    } finally {
      setIsWorking(false)
    }
  }

  async function signUp() {
    setIsWorking(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      })
      if (error) throw error
      toast.success('Account created')
    } catch (e: unknown) {
      console.error(e)
      toast.error(errorMessage(e) || 'Could not sign up')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Zeeter</CardTitle>
          <CardDescription>
            Sign in to post, follow, like, comment, and get notifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              if (v === 'signin' || v === 'signup') setTab(v)
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <div className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                />
              </div>

              <TabsContent value="signin" className="mt-0">
                <Button
                  className="w-full"
                  onClick={signIn}
                  disabled={isWorking || !email.trim() || !password}
                >
                  {isWorking ? 'Signing in…' : 'Sign in'}
                </Button>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <Button
                  className="w-full"
                  onClick={signUp}
                  disabled={isWorking || !email.trim() || !password}
                >
                  {isWorking ? 'Creating…' : 'Create account'}
                </Button>
                <div className="mt-3 text-xs text-muted-foreground">
                  Tip: try the seeded demo accounts (password{' '}
                  <span className="font-medium text-foreground">Password123!</span>):
                  <div className="mt-1 space-y-1">
                    <div>alice@zeeter.dev</div>
                    <div>bob@zeeter.dev</div>
                    <div>carol@zeeter.dev</div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
