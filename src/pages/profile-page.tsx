import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { type UserProfile } from '../types'
import { BottomNav } from '../components/layout/bottom-nav'
import { ScoreBadge } from '../components/ui/score-badge'
import { supabase } from '../lib/supabase'

interface ProfilePageProps {
  profile: UserProfile
  onSignOut: () => void
}

export function ProfilePage({ profile, onSignOut }: ProfilePageProps) {
  const navigate = useNavigate()
  const [crew, setCrew] = useState<UserProfile[]>([])
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)

  useEffect(() => {
    loadCrew(profile.user_id).then(setCrew)
    supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', profile.user_id)
      .then(({ count }) => setFollowerCount(count ?? 0))
    supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', profile.user_id)
      .then(({ count }) => setFollowingCount(count ?? 0))
  }, [profile.user_id])

  const allTags = [...(profile.interests ?? []), ...(profile.custom_interests ?? [])]
  const memberSince = new Date(profile.created_at).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg)' }}>

      {/* Violet header band */}
      <div className="relative h-36"
        style={{ background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 60%, #9F67FF 100%)' }}>
        <div className="relative flex items-center justify-between px-5 pt-5">
          <span className="text-white/80 text-xs font-black uppercase tracking-widest">Mein Profil</span>
          <button
            onClick={onSignOut}
            className="text-white/70 text-sm font-semibold hover:text-white transition-colors"
          >
            Ausloggen
          </button>
        </div>
      </div>

      {/* Avatar overlapping band */}
      <div className="relative px-5 -mt-12">
        <div className="flex items-end justify-between mb-4">
          <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 bg-white"
            style={{ border: '3px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                {profile.name[0].toUpperCase()}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/profile/edit')}
            className="px-4 py-2 rounded-2xl text-sm font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
          >
            Bearbeiten
          </button>
        </div>

        {/* Name + bio */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="text-2xl font-black text-gray-900">
              {profile.name}
              {profile.age && <span className="text-gray-400 font-normal text-lg ml-2">{profile.age}</span>}
            </h1>
            <ScoreBadge score={profile.show_up_score ?? 100} count={profile.ratings_count ?? 0} size="md" />
          </div>
          {(profile.city || profile.district) && (
            <div className="flex items-center gap-1.5 text-sm mb-2 text-gray-500">
              <svg className="w-3.5 h-3.5 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {[profile.district, profile.city].filter(Boolean).join(', ')}
            </div>
          )}
          {profile.bio && (
            <p className="text-sm leading-relaxed text-gray-600">{profile.bio}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { value: profile.activities_count, label: 'Activities' },
            { value: followerCount, label: 'Follower' },
            { value: followingCount, label: 'Following' },
            { value: crew.length, label: 'Crew' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl py-3 text-center card-shadow"
              style={{ border: '1px solid var(--border)' }}>
              <div className="text-xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs font-semibold text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Interessen */}
        {allTags.length > 0 && (
          <div className="bg-white rounded-3xl p-4 mb-3 card-shadow" style={{ border: '1px solid var(--border)' }}>
            <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400">Interessen</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <span key={tag} className="px-3 py-1.5 rounded-full text-xs font-bold text-violet-700 bg-violet-50 border border-violet-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Sprachen */}
        {profile.languages?.length > 0 && (
          <div className="bg-white rounded-3xl p-4 mb-3 card-shadow" style={{ border: '1px solid var(--border)' }}>
            <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400">Sprachen</p>
            <div className="flex flex-wrap gap-2">
              {profile.languages.map(lang => (
                <span key={lang} className="px-3 py-1.5 rounded-full text-xs font-bold text-gray-600 bg-gray-100 border border-gray-200">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Crew */}
        {crew.length > 0 && (
          <div className="bg-white rounded-3xl p-4 mb-3 card-shadow" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-black uppercase tracking-widest text-gray-400">Meine Crew</p>
              <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black flex items-center justify-center">{crew.length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {crew.map(member => (
                <button key={member.user_id} onClick={() => navigate(`/user/${member.user_id}`)}
                  className="press flex items-center gap-3 w-full text-left">
                  <div className="w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                    {member.avatar_url
                      ? <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-base font-black text-white"
                          style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>{member.name[0]}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900">{member.name}</div>
                    {member.city && <div className="text-xs text-gray-500">{member.city}</div>}
                  </div>
                  <ScoreBadge score={member.show_up_score ?? 100} count={member.ratings_count ?? 0} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Account Settings */}
        <AccountSection />

        {/* Mitglied seit */}
        <p className="text-center text-xs font-semibold text-gray-400 mb-1">
          Dabei seit {memberSince}
        </p>

        {/* Legal links */}
        <div className="flex justify-center gap-4 mb-2">
          <button onClick={() => navigate('/impressum')}
            className="text-xs font-semibold text-gray-400 hover:text-violet-600 transition-colors">
            Impressum
          </button>
          <span className="text-gray-200">·</span>
          <button onClick={() => navigate('/datenschutz')}
            className="text-xs font-semibold text-gray-400 hover:text-violet-600 transition-colors">
            Datenschutz
          </button>
        </div>

        {/* Delete account */}
        <DeleteAccountButton onDeleted={onSignOut} />

        {/* Empty state */}
        {allTags.length === 0 && (
          <div className="bg-white rounded-3xl p-6 text-center card-shadow mt-3" style={{ border: '1px solid var(--border)' }}>
            <p className="text-3xl mb-3">👋</p>
            <p className="text-sm mb-4 text-gray-500">Zeig anderen wer du bist — füge Interessen hinzu.</p>
            <button onClick={() => navigate('/profile/edit')}
              className="press px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
              Profil ergänzen
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

// Computes users who shared 3+ activities with the given userId
async function loadCrew(userId: string): Promise<UserProfile[]> {
  // Get all activity IDs where I'm an accepted participant
  const { data: myRequests } = await supabase
    .from('activity_requests')
    .select('activity_id')
    .eq('user_id', userId)
    .eq('status', 'accepted')

  // Get all activity IDs where I'm the host
  const { data: myHosted } = await supabase
    .from('activities')
    .select('id')
    .eq('host_id', userId)

  const myActivityIds = [
    ...(myRequests ?? []).map(r => r.activity_id as string),
    ...(myHosted ?? []).map(a => a.id as string),
  ]

  if (myActivityIds.length === 0) return []

  // Get all accepted participants in those activities (excluding myself)
  const { data: others } = await supabase
    .from('activity_requests')
    .select('user_id, activity_id')
    .in('activity_id', myActivityIds)
    .eq('status', 'accepted')
    .neq('user_id', userId)

  if (!others?.length) return []

  // Count how many shared activities each user has with me
  const counts: Record<string, number> = {}
  for (const r of others) {
    counts[r.user_id] = (counts[r.user_id] ?? 0) + 1
  }

  // Crew = users with 3+ shared activities
  const crewIds = Object.entries(counts)
    .filter(([, count]) => count >= 3)
    .map(([uid]) => uid)

  if (crewIds.length === 0) return []

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('*')
    .in('user_id', crewIds)

  return profiles ?? []
}

// Account settings: email display + password change
function AccountSection() {
  const [email, setEmail] = useState<string | null>(null)
  const [provider, setProvider] = useState<string>('email')
  const [open, setOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
      setProvider(data.user?.app_metadata?.provider ?? 'email')
    })
  }, [])

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (newPassword.length < 8) {
      setMsg({ type: 'err', text: 'Passwort muss mindestens 8 Zeichen haben.' }); return
    }
    if (newPassword !== confirmPassword) {
      setMsg({ type: 'err', text: 'Passwörter stimmen nicht überein.' }); return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) {
      setMsg({ type: 'err', text: 'Fehler: ' + error.message })
    } else {
      setMsg({ type: 'ok', text: '✅ Passwort erfolgreich geändert.' })
      setNewPassword(''); setConfirmPassword(''); setOpen(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl p-4 mb-3 card-shadow" style={{ border: '1px solid var(--border)' }}>
      <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400">Account</p>

      {/* Email */}
      {email && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm">
            {provider === 'google' ? '🔵' : '✉️'}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400">{provider === 'google' ? 'Google-Konto' : 'E-Mail'}</p>
            <p className="text-sm font-bold text-gray-800">{email}</p>
          </div>
        </div>
      )}

      {/* Password change — only for email/password users */}
      {provider === 'email' && (
        <>
          <button onClick={() => { setOpen(o => !o); setMsg(null) }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all"
            style={{ background: '#F9F9FB', borderColor: '#E8E8ED', color: '#374151' }}>
            <span>🔑 Passwort ändern</span>
            <span className="text-gray-300 text-xs">{open ? '▲' : '▼'}</span>
          </button>

          {open && (
            <form onSubmit={handleChangePassword} className="flex flex-col gap-2 mt-3">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Neues Passwort (min. 8 Zeichen)"
                required minLength={8}
                className="w-full px-4 py-2.5 rounded-2xl text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 outline-none focus:border-violet-400 focus:bg-white transition-all"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Passwort bestätigen"
                required minLength={8}
                className="w-full px-4 py-2.5 rounded-2xl text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 outline-none focus:border-violet-400 focus:bg-white transition-all"
              />
              {msg && (
                <p className={`text-xs font-semibold px-3 py-2 rounded-xl ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                  {msg.text}
                </p>
              )}
              <button type="submit" disabled={saving}
                className="w-full py-2.5 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                {saving ? 'Wird gespeichert…' : 'Passwort speichern'}
              </button>
            </form>
          )}
        </>
      )}

      {provider === 'google' && (
        <p className="text-xs text-gray-400 px-1">
          Du bist per Google eingeloggt — Passwort wird über Google verwaltet.
        </p>
      )}
    </div>
  )
}

// Delete account button with confirmation flow
function DeleteAccountButton({ onDeleted }: { onDeleted: () => void }) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'deleting'>('idle')

  async function handleDelete() {
    setStep('deleting')
    await supabase.rpc('delete_current_user')
    await supabase.auth.signOut()
    onDeleted()
  }

  if (step === 'idle') {
    return (
      <button onClick={() => setStep('confirm')}
        className="w-full text-center text-xs font-semibold text-gray-300 hover:text-red-400 transition-colors py-2">
        Konto löschen
      </button>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="bg-red-50 border border-red-100 rounded-3xl p-5 flex flex-col gap-3">
        <div>
          <p className="text-sm font-black text-red-600">Konto wirklich löschen?</p>
          <p className="text-xs text-red-400 mt-1">Alle deine Daten werden sofort und unwiderruflich gelöscht.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStep('idle')}
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-gray-600 bg-white border border-gray-200">
            Abbrechen
          </button>
          <button onClick={handleDelete}
            className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-white bg-red-500 border border-red-400">
            Löschen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center py-4">
      <div className="w-5 h-5 border-2 border-red-200 border-t-red-500 rounded-full animate-spin mx-auto" />
      <p className="text-xs text-gray-400 mt-2">Wird gelöscht…</p>
    </div>
  )
}
