import { NavLink } from 'react-router-dom'

interface BottomNavProps {
  pendingCount?: number
}

export function BottomNav({ pendingCount = 0 }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 pb-safe">
      <div style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-4">

          {/* Feed */}
          <NavLink to="/feed" className="flex flex-col items-center gap-1">
            {({ isActive }) => (
              <>
                <div className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`}
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }}>
                  <svg className="w-6 h-6" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isActive ? 0 : 1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold transition-all duration-200"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }}>
                  Feed
                </span>
              </>
            )}
          </NavLink>

          {/* Create */}
          <NavLink to="/create">
            {({ isActive }) => (
              <div className="press w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
                  boxShadow: isActive ? '0 8px 24px rgba(124,58,237,0.55)' : '0 4px 14px rgba(124,58,237,0.35)',
                }}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            )}
          </NavLink>

          {/* Meine Aktivitäten */}
          <NavLink to="/my" className="flex flex-col items-center gap-1 relative">
            {({ isActive }) => (
              <>
                <div className="relative">
                  <div className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`}
                    style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }}>
                    <svg className="w-6 h-6" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isActive ? 0 : 1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold transition-all duration-200"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }}>
                  Meine
                </span>
              </>
            )}
          </NavLink>

          {/* Profil */}
          <NavLink to="/profile" className="flex flex-col items-center gap-1">
            {({ isActive }) => (
              <>
                <div className={`transition-all duration-200 ${isActive ? 'scale-110' : ''}`}
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }}>
                  <svg className="w-6 h-6" fill={isActive ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={isActive ? 0 : 1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-[10px] font-bold transition-all duration-200"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }}>
                  Profil
                </span>
              </>
            )}
          </NavLink>

        </div>
      </div>
    </nav>
  )
}
