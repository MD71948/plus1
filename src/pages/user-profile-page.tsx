import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { type UserProfile, type Activity } from '../types'
import { ScoreBadge } from '../components/ui/score-badge'
import { getCategoryClass } from '../lib/utils'
import { ACTIVITY_CATEGORIES } from '../lib/constants'

interface UserProfilePageProps {
  currentUserId: string
}

export function UserProfilePage({ currentUserId }: UserProfilePageProps) {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [reportReason, setReportReason] = useState('')

  useEffect(() => {
    if (!userId) return
    // If viewing own profile, redirect
    if (userId === currentUserId) { navigate('/profile', { replace: true }); return }

    Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
      supabase.from('activities')
        .select('*')
        .eq('host_id', userId)
        .in('status', ['open', 'full'])
        .gte('date_time', new Date().toISOString())
        .order('date_time', { ascending: true })
        .limit(5),
    ]).then(([{ data: prof }, { data: acts }]) => {
      setProfile(prof)
      setActivities(acts ?? [])
      setLoading(false)
    })
  }, [userId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg)' }}>
        <p className="text-2xl">👤</p>
        <p className="text-sm text-gray-500">Profil nicht gefunden.</p>
        <button onClick={() => navigate(-1)} className="text-sm font-bold text-violet-600">Zurück</button>
      </div>
    )
  }

  const allTags = [...(profile.interests ?? []), ...(profile.custom_interests ?? [])]
  const memberSince = new Date(profile.created_at).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })

  return (
    <div className="min-h-screen pb-10" style={{ background: 'var(--bg)' }}>

      {/* Violet header */}
      <div className="relative h-36"
        style={{ background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 60%, #9F67FF 100%)' }}>
        <div className="px-5 pt-5 flex items-center justify-between">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-white/80 text-xs font-black uppercase tracking-widest">Profil</span>
          <button onClick={() => setShowReportModal(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-all"
            title="Melden">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative px-5 -mt-12">
        {/* Avatar + score */}
        <div className="flex items-end justify-between mb-4">
          <div className="w-24 h-24 rounded-3xl overflow-hidden flex-shrink-0 bg-white"
            style={{ border: '3px solid white', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                  {profile.name[0].toUpperCase()}
                </div>
            }
          </div>
          <div className="flex flex-col items-end gap-1.5 mb-2">
            <ScoreBadge score={profile.show_up_score ?? 100} count={profile.ratings_count ?? 0} size="md" />
            <span className="text-xs text-gray-400 font-medium">{profile.activities_count ?? 0} Activities</span>
          </div>
        </div>

        {/* Name + meta */}
        <div className="mb-5">
          <h1 className="text-2xl font-black text-gray-900">{profile.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {profile.age && (
              <span className="text-sm text-gray-500 font-medium">{profile.age} Jahre</span>
            )}
            {(profile.city || profile.district) && (
              <>
                {profile.age && <span className="text-gray-300">·</span>}
                <span className="text-sm text-gray-500 font-medium flex items-center gap-1">
                  📍 {profile.district ?? profile.city}
                </span>
              </>
            )}
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">Dabei seit {memberSince}</span>
          </div>
          {profile.bio && (
            <p className="text-sm text-gray-600 leading-relaxed mt-3">{profile.bio}</p>
          )}
        </div>

        <div className="flex flex-col gap-4">

          {/* Sprachen */}
          {profile.languages?.length > 0 && (
            <div className="bg-white rounded-3xl p-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Sprachen</p>
              <div className="flex flex-wrap gap-2">
                {profile.languages.map(lang => (
                  <span key={lang} className="px-3 py-1.5 rounded-2xl text-xs font-bold bg-gray-50 text-gray-700 border border-gray-200">
                    🗣️ {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Interessen */}
          {allTags.length > 0 && (
            <div className="bg-white rounded-3xl p-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Interessen</p>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <span key={tag} className="px-3 py-1.5 rounded-2xl text-xs font-bold bg-violet-50 text-violet-700 border border-violet-100">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Aktuelle Activities */}
          {activities.length > 0 && (
            <div className="bg-white rounded-3xl p-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
              <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Aktuelle Aktivitäten</p>
              <div className="flex flex-col divide-y divide-gray-50">
                {activities.map(a => {
                  const catClass = getCategoryClass(a.category)
                  const catEmoji = ACTIVITY_CATEGORIES.find(c => c.label === a.category)?.emoji ?? '📌'
                  const isToday = new Date(a.date_time).toDateString() === new Date().toDateString()
                  const dateStr = isToday
                    ? 'Heute'
                    : new Date(a.date_time).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
                  const timeStr = new Date(a.date_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
                  const spotsLeft = a.spots_total - a.spots_taken
                  return (
                    <button key={a.id} onClick={() => navigate(`/activity/${a.id}`)}
                      className="press flex items-center gap-3 py-3 first:pt-0 last:pb-0 text-left w-full">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 bg-gray-50">
                        {catEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{a.title}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">{dateStr} · {timeStr} Uhr</p>
                      </div>
                      <span className={`${catClass} text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0`}>
                        {spotsLeft > 0 ? `${spotsLeft} frei` : 'Voll'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => { setShowReportModal(false); setReportReason('') }}>
          <div className="w-full max-w-lg bg-white rounded-3xl p-5 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}>
            {reportSent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="text-4xl">✅</div>
                <h3 className="text-base font-black text-gray-900">Meldung gesendet</h3>
                <p className="text-sm text-gray-500">Danke. Wir prüfen das Profil.</p>
                <button onClick={() => { setShowReportModal(false); setReportSent(false); setReportReason('') }}
                  className="mt-2 px-6 py-2.5 rounded-2xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                  Schließen
                </button>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-base font-black text-gray-900">Profil melden</h3>
                  <p className="text-xs text-gray-400 mt-1">Warum meldest du dieses Profil?</p>
                </div>
                <div className="flex flex-col gap-2">
                  {[
                    'Person nutzt App zum Daten',
                    'Belästigung oder unangemessenes Verhalten',
                    'Fake-Profil / falsche Identität',
                    'Anderes',
                  ].map(reason => (
                    <button key={reason} onClick={() => setReportReason(reason)}
                      className="px-4 py-3 rounded-2xl text-sm font-semibold text-left border transition-all"
                      style={reportReason === reason
                        ? { background: '#FEE2E2', borderColor: '#FECACA', color: '#EF4444' }
                        : { background: '#F9F9FB', borderColor: '#E8E8ED', color: '#374151' }}>
                      {reason}
                    </button>
                  ))}
                </div>
                <button
                  disabled={!reportReason}
                  onClick={async () => {
                    if (!reportReason || !userId) return
                    await supabase.from('user_reports').insert({
                      reporter_id: currentUserId,
                      reported_user_id: userId,
                      reason: reportReason,
                    })
                    setReportSent(true)
                  }}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
                  Meldung abschicken
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
