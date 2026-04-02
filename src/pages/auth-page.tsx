import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

type Screen = 'landing' | 'login' | 'register'

export function AuthPage() {
  const [screen, setScreen] = useState<Screen>('landing')
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
    if (screen === 'register') {
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

  // Landing / Onboarding screen
  if (screen === 'landing') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0B' }}>

        {/* Hero illustration area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8 relative overflow-hidden">

          {/* Background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)', filter: 'blur(40px)' }} />
          </div>

          {/* Logo */}
          <div className="relative mb-10 animate-fade-up">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl animate-pulse-glow mx-auto"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
              ⚡
            </div>
            <h1 className="text-5xl font-black text-white text-center mt-5 tracking-tight">plus1</h1>
            <p className="text-white/40 text-center text-sm font-medium mt-2">
              Von "Ich hab Bock" zu "Wir sind komplett."
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 w-full max-w-xs animate-fade-up delay-100">
            {[
              { emoji: '⚡', text: 'Activity in 30 Sekunden erstellen' },
              { emoji: '📍', text: 'Spontan-Aktivitäten in deiner Nähe' },
              { emoji: '🤝', text: 'Echte Verbindungen, keine Dating-App' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-xl">{f.emoji}</span>
                <span className="text-sm font-semibold text-white/70">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA buttons */}
        <div className="px-6 pb-12 flex flex-col gap-3 animate-fade-up delay-200">
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="press w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 4px 20px rgba(124,58,237,0.45)' }}
          >
            {googleLoading
              ? <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#fff" fillOpacity=".9" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#fff" fillOpacity=".75" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#fff" fillOpacity=".6" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#fff" fillOpacity=".5" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
            }
            Mit Google starten
          </button>

          <button
            onClick={() => setScreen('register')}
            className="press w-full h-14 rounded-2xl flex items-center justify-center font-bold text-sm transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'white' }}
          >
            Mit E-Mail registrieren
          </button>

          <p className="text-center text-sm text-white/30 font-medium mt-1">
            Schon dabei?{' '}
            <button onClick={() => setScreen('login')} className="text-violet-400 font-bold hover:text-violet-300">
              Einloggen
            </button>
          </p>
        </div>
      </div>
    )
  }

  // Login / Register form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: 'var(--bg)' }}>

      <div className="w-full max-w-sm">

        {/* Back button */}
        <button onClick={() => { setScreen('landing'); setError(''); setSuccess('') }}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 mb-8 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Zurück
        </button>

        <div className="mb-8 animate-fade-up">
          <h2 className="text-3xl font-black text-gray-900">
            {screen === 'login' ? 'Willkommen zurück 👋' : 'Konto erstellen ⚡'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {screen === 'login' ? 'Schön, dass du wieder da bist.' : 'In 30 Sekunden dabei sein.'}
          </p>
        </div>

        <div className="flex flex-col gap-4 animate-fade-up delay-100">

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="press w-full h-12 rounded-2xl flex items-center justify-center gap-3 font-semibold text-sm text-gray-700 transition-all bg-white border border-gray-200 hover:bg-gray-50 card-shadow"
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
            Mit Google {screen === 'login' ? 'einloggen' : 'registrieren'}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">oder</span>
            <div className="flex-1 h-px bg-gray-200" />
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
              {screen === 'login' ? 'Einloggen' : 'Konto erstellen'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 font-medium">
            {screen === 'login' ? 'Noch kein Account?' : 'Schon dabei?'}{' '}
            <button
              onClick={() => { setScreen(screen === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
              className="text-violet-600 font-bold hover:text-violet-700 transition-colors"
            >
              {screen === 'login' ? 'Registrieren' : 'Einloggen'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
