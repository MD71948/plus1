import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { type Activity, type ActivityRequest } from '../types'
import { BottomNav } from '../components/layout/bottom-nav'
import { getCategoryClass } from '../lib/utils'

interface MyActivitiesPageProps {
  userId: string
  pendingCount?: number
}

type Tab = 'hosting' | 'attending' | 'requests'

export function MyActivitiesPage({ userId, pendingCount = 0 }: MyActivitiesPageProps) {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('hosting')
  const [hosting, setHosting] = useState<Activity[]>([])
  const [attending, setAttending] = useState<Activity[]>([])
  const [myRequests, setMyRequests] = useState<(ActivityRequest & { activity: Activity })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)

    // Activities I host
    const { data: hosted } = await supabase
      .from('activities')
      .select('*')
      .eq('host_id', userId)
      .order('date_time', { ascending: false })
    setHosting(hosted ?? [])

    // Activities I'm attending (accepted requests)
    const { data: acceptedReqs } = await supabase
      .from('activity_requests')
      .select('*, activity:activities(*)')
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false })

    const attendingActivities = (acceptedReqs ?? [])
      .map(r => r.activity as Activity)
      .filter(Boolean)
    setAttending(attendingActivities)

    // All my requests (including pending/rejected)
    const { data: allReqs } = await supabase
      .from('activity_requests')
      .select('*, activity:activities(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    setMyRequests((allReqs ?? []).filter(r => r.activity) as (ActivityRequest & { activity: Activity })[])

    setLoading(false)
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'hosting', label: 'Ich hoste', count: hosting.length },
    { key: 'attending', label: 'Ich bin dabei', count: attending.length },
    { key: 'requests', label: 'Anfragen', count: myRequests.filter(r => r.status === 'pending').length },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="sticky top-0 z-10"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center">
          <h1 className="text-xl font-black text-gray-900">Meine Aktivitäten</h1>
        </div>

        {/* Tabs */}
        <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-200 border"
              style={tab === t.key
                ? { background: '#0A0A0B', color: 'white', borderColor: '#0A0A0B' }
                : { background: 'white', color: 'var(--text-3)', borderColor: 'var(--border)' }
              }>
              {t.label}
              {t.count > 0 && (
                <span className="w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center"
                  style={tab === t.key
                    ? { background: 'rgba(255,255,255,0.2)', color: 'white' }
                    : { background: 'var(--bg)', color: 'var(--text-2)' }
                  }>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
          </div>
        ) : (
          <>
            {/* Hosting tab */}
            {tab === 'hosting' && (
              hosting.length === 0 ? (
                <EmptyState
                  icon="🎯"
                  title="Noch keine Aktivitäten"
                  sub="Erstell deine erste Aktivität."
                  action={{ label: 'Jetzt erstellen', onClick: () => navigate('/create') }}
                />
              ) : (
                hosting.map(a => <ActivityRow key={a.id} activity={a} showStatus onClick={() => navigate(`/activity/${a.id}`)} />)
              )
            )}

            {/* Attending tab */}
            {tab === 'attending' && (
              attending.length === 0 ? (
                <EmptyState
                  icon="🤝"
                  title="Noch bei keiner Aktivität dabei"
                  sub="Schick eine Anfrage und werde bestätigt."
                  action={{ label: 'Feed anschauen', onClick: () => navigate('/feed') }}
                />
              ) : (
                attending.map(a => <ActivityRow key={a.id} activity={a} onClick={() => navigate(`/activity/${a.id}`)} />)
              )
            )}

            {/* Requests tab */}
            {tab === 'requests' && (
              myRequests.length === 0 ? (
                <EmptyState icon="📨" title="Keine Anfragen" sub="Du hast noch keine Anfragen gesendet." />
              ) : (
                myRequests.map(req => (
                  <RequestRow key={req.id} req={req} onClick={() => navigate(`/activity/${req.activity_id}`)} />
                ))
              )
            )}
          </>
        )}
      </div>

      <BottomNav pendingCount={pendingCount} />
    </div>
  )
}

function ActivityRow({ activity: a, showStatus, onClick }: { activity: Activity; showStatus?: boolean; onClick: () => void }) {
  const catClass = getCategoryClass(a.category)
  const isToday = new Date(a.date_time).toDateString() === new Date().toDateString()
  const dateStr = isToday
    ? 'Heute'
    : new Date(a.date_time).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = new Date(a.date_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const isPast = new Date(a.date_time) < new Date()

  return (
    <div onClick={onClick}
      className={`press bg-white rounded-3xl p-4 flex items-center gap-3 cursor-pointer card-shadow transition-all hover:shadow-md ${isPast ? 'opacity-60' : ''}`}
      style={{ border: '1px solid var(--border)' }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl"
        style={{ background: 'var(--bg)' }}>
        {a.category === 'Sport' ? '⚽' :
          a.category === 'Outdoor' ? '🏕️' :
          a.category === 'Essen' ? '🍕' :
          a.category === 'Kultur' ? '🎨' :
          a.category === 'Musik' ? '🎵' :
          a.category === 'Gaming' ? '🎮' :
          a.category === 'Reisen' ? '✈️' :
          a.category === 'Lernen' ? '📚' : '⚡'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-900 truncate">{a.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`${catClass} text-[10px] font-bold px-2 py-0.5 rounded-full border`}>{a.category}</span>
          <span className="text-xs text-gray-400">{isToday ? <span className="text-violet-600 font-bold">Heute</span> : dateStr} · {timeStr}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {showStatus && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full border
            ${a.status === 'cancelled' ? 'bg-red-50 text-red-500 border-red-100' :
              a.status === 'full' ? 'bg-gray-100 text-gray-500 border-gray-200' :
              'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {a.status === 'cancelled' ? 'Abgesagt' : a.status === 'full' ? 'Voll' : `${a.spots_total - a.spots_taken} frei`}
          </span>
        )}
        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )
}

function RequestRow({ req, onClick }: { req: ActivityRequest & { activity: Activity }; onClick: () => void }) {
  const a = req.activity
  const catClass = getCategoryClass(a.category)
  const dateStr = new Date(a.date_time).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })

  const statusConfig = {
    pending: { label: 'Ausstehend', style: { background: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' } },
    accepted: { label: 'Bestätigt ✓', style: { background: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' } },
    rejected: { label: 'Abgelehnt', style: { background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' } },
  }
  const sc = statusConfig[req.status as keyof typeof statusConfig]

  return (
    <div onClick={onClick}
      className="press bg-white rounded-3xl p-4 flex items-center gap-3 cursor-pointer card-shadow hover:shadow-md"
      style={{ border: '1px solid var(--border)' }}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-900 truncate">{a.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`${catClass} text-[10px] font-bold px-2 py-0.5 rounded-full border`}>{a.category}</span>
          <span className="text-xs text-gray-400">{dateStr}</span>
        </div>
        {req.message && <p className="text-xs text-gray-400 mt-1 italic truncate">„{req.message}"</p>}
      </div>
      <span className="text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0" style={sc.style}>
        {sc.label}
      </span>
    </div>
  )
}

function EmptyState({ icon, title, sub, action }: {
  icon: string; title: string; sub: string; action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl bg-violet-50">{icon}</div>
      <div>
        <h2 className="text-lg font-black text-gray-900">{title}</h2>
        <p className="text-sm mt-1 text-gray-500">{sub}</p>
      </div>
      {action && (
        <button onClick={action.onClick}
          className="press px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
          {action.label}
        </button>
      )}
    </div>
  )
}
