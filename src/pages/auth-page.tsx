import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setSuccess('Check deine E-Mails — wir haben dir einen Link geschickt.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError('E-Mail oder Passwort falsch.')
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) { setError('Google-Login fehlgeschlagen.'); setGoogleLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: 'var(--bg)' }}>

      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5 animate-pulse-glow"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
            <span className="text-4xl">⚡</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-2">plus1</h1>
          <p className="text-gray-500 text-sm font-medium">Spontane Aktivitäten. Echte Verbindungen.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 flex flex-col gap-4 animate-fade-up delay-100 card-shadow-md">

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="press w-full h-12 rounded-2xl flex items-center justify-center gap-3 font-semibold text-sm text-gray-700 transition-all duration-200 border border-gray-200 bg-white hover:bg-gray-50"
          >
            {googleLoading
              ? <svg className="w-5 h-5 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
            }
            Mit Google {mode === 'login' ? 'einloggen' : 'registrieren'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">oder</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
            <Input
              label="E-Mail"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="deine@email.de"
              required
            />
            <Input
              label="Passwort"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mindestens 6 Zeichen"
              required
              minLength={6}
            />

            {error && (
              <div className="px-4 py-3 rounded-2xl text-sm text-red-600 font-medium bg-red-50 border border-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="px-4 py-3 rounded-2xl text-sm text-green-600 font-medium bg-green-50 border border-green-100">
                {success}
              </div>
            )}

            <Button type="submit" size="lg" className="w-full mt-1" loading={loading}>
              {mode === 'login' ? 'Einloggen' : 'Account erstellen'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 font-medium">
            {mode === 'login' ? 'Noch kein Account?' : 'Schon dabei?'}{' '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
              className="text-violet-600 font-bold hover:text-violet-700 transition-colors"
            >
              {mode === 'login' ? 'Registrieren' : 'Einloggen'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
