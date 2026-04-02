import { useRef, useState } from 'react'
import { type UserProfile } from '../../types'

interface SwipeCardProps {
  profile: UserProfile | null
  message: string | null
  onAccept: () => void
  onReject: () => void
  loading: boolean
}

const THRESHOLD = 80 // px to trigger action

export function SwipeCard({ profile, message, onAccept, onReject, loading }: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const startX = useRef(0)
  const [dx, setDx] = useState(0)
  const [released, setReleased] = useState(false)

  const rotation = dx * 0.08
  const acceptOpacity = Math.min(1, Math.max(0, dx / THRESHOLD))
  const rejectOpacity = Math.min(1, Math.max(0, -dx / THRESHOLD))

  function onStart(clientX: number) {
    startX.current = clientX
    setReleased(false)
  }

  function onMove(clientX: number) {
    setDx(clientX - startX.current)
  }

  function onEnd() {
    setReleased(true)
    if (dx > THRESHOLD) {
      onAccept()
    } else if (dx < -THRESHOLD) {
      onReject()
    }
    setDx(0)
  }

  return (
    <div className="relative select-none">
      {/* Accept / Reject labels */}
      <div className="absolute inset-0 rounded-3xl flex items-center justify-center pointer-events-none z-10"
        style={{ opacity: acceptOpacity, background: 'rgba(34,197,94,0.15)', border: '2px solid #22C55E', borderRadius: '24px' }}>
        <span className="text-2xl font-black text-emerald-600 rotate-[-20deg]">✓ DABEI</span>
      </div>
      <div className="absolute inset-0 rounded-3xl flex items-center justify-center pointer-events-none z-10"
        style={{ opacity: rejectOpacity, background: 'rgba(239,68,68,0.15)', border: '2px solid #EF4444', borderRadius: '24px' }}>
        <span className="text-2xl font-black text-red-500 rotate-[20deg]">✕ NEIN</span>
      </div>

      {/* Card */}
      <div
        ref={cardRef}
        className="bg-white rounded-3xl p-4 card-shadow cursor-grab active:cursor-grabbing"
        style={{
          border: '1px solid var(--border)',
          transform: `translateX(${dx}px) rotate(${rotation}deg)`,
          transition: released ? 'transform 0.3s ease' : 'none',
          userSelect: 'none',
          touchAction: 'pan-y',
        }}
        onMouseDown={e => onStart(e.clientX)}
        onMouseMove={e => { if (e.buttons === 1) onMove(e.clientX) }}
        onMouseUp={onEnd}
        onMouseLeave={() => { if (dx !== 0) onEnd() }}
        onTouchStart={e => onStart(e.touches[0].clientX)}
        onTouchMove={e => onMove(e.touches[0].clientX)}
        onTouchEnd={onEnd}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-lg font-black text-white"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                  {profile?.name?.[0] ?? '?'}
                </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-black text-gray-900">{profile?.name ?? 'Unbekannt'}</div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {profile?.city && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {profile.city}
                </span>
              )}
              {profile?.age && <span className="text-xs text-gray-400">{profile.age} J.</span>}
            </div>
          </div>
        </div>

        {/* Interests */}
        {(profile?.interests?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {profile!.interests.slice(0, 4).map(tag => (
              <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full text-violet-700 bg-violet-50 border border-violet-100">
                {tag}
              </span>
            ))}
          </div>
        )}

        {message && (
          <div className="bg-gray-50 rounded-2xl px-3 py-2 text-xs text-gray-600 italic border border-gray-100 mb-3">
            „{message}"
          </div>
        )}

        {/* Swipe hint */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Ablehnen
          </div>
          <span className="text-[10px] text-gray-300 font-medium">← swipe →</span>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            Annehmen
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        {/* Tap buttons as fallback */}
        <div className="flex gap-2 mt-3">
          <button onClick={e => { e.stopPropagation(); onReject() }} disabled={loading}
            className="press flex-1 py-2.5 rounded-2xl text-sm font-bold text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all">
            ✕ Ablehnen
          </button>
          <button onClick={e => { e.stopPropagation(); onAccept() }} disabled={loading}
            className="press flex-1 py-2.5 rounded-2xl text-sm font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 transition-all">
            ✓ Annehmen
          </button>
        </div>
      </div>
    </div>
  )
}
