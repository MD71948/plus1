import { useNavigate } from 'react-router-dom'
import { type UserProfile } from '../types'
import { BottomNav } from '../components/layout/bottom-nav'
import { ScoreBadge } from '../components/ui/score-badge'

interface ProfilePageProps {
  profile: UserProfile
  onSignOut: () => void
}

export function ProfilePage({ profile, onSignOut }: ProfilePageProps) {
  const navigate = useNavigate()

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
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { value: profile.activities_count, label: 'Aktivitäten' },
            { value: allTags.length, label: 'Interessen' },
            { value: profile.languages?.length ?? 0, label: 'Sprachen' },
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

        {/* Mitglied seit */}
        <p className="text-center text-xs font-semibold text-gray-400">
          Dabei seit {memberSince}
        </p>

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
