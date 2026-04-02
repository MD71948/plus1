import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BottomNav } from '../components/layout/bottom-nav'
import { ACTIVITY_CATEGORIES } from '../lib/constants'

interface NotificationsPageProps {
  userId: string
  onSeen: () => void
}

interface RequestNotif {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  updated_at: string
  created_at: string
  activity_id: string
  activity_title: string
  activity_category: string
  activity_date: string
}

interface MessageNotif {
  id: string
  content: string
  created_at: string
  activity_id: string
  activity_title: string
  sender_name: string
  sender_avatar: string | null
}

export function NotificationsPage({ userId, onSeen }: NotificationsPageProps) {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<RequestNotif[]>([])
  const [messages, setMessages] = useState<MessageNotif[]>([])
  const [loading, setLoading] = useState(true)
  const lastSeen = localStorage.getItem('notifs_last_seen') ?? '2000-01-01'

  useEffect(() => {
    fetchAll()
    // Mark as seen when page opens
    localStorage.setItem('notifs_last_seen', new Date().toISOString())
    onSeen()
  }, [])

  async function fetchAll() {
    setLoading(true)

    // 1. My sent requests with activity info
    const { data: reqData } = await supabase
      .from('activity_requests')
      .select('id, status, updated_at, created_at, activity_id, activities(title, category, date_time)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(30)

    if (reqData) {
      setRequests(reqData.map(r => {
        const act = r.activities as { title: string; category: string; date_time: string } | null
        return {
          id: r.id,
          status: r.status as 'pending' | 'accepted' | 'rejected',
          updated_at: r.updated_at,
          created_at: r.created_at,
          activity_id: r.activity_id,
          activity_title: act?.title ?? 'Aktivität',
          activity_category: act?.category ?? '',
          activity_date: act?.date_time ?? '',
        }
      }))
    }

    // 2. Activities I'm participating in (accepted requests)
    const { data: acceptedReqs } = await supabase
      .from('activity_requests')
      .select('activity_id, activities(title)')
      .eq('user_id', userId)
      .eq('status', 'accepted')

    // 3. Activities I host
    const { data: hostedActs } = await supabase
      .from('activities')
      .select('id, title')
      .eq('host_id', userId)

    const participatingIds = (acceptedReqs ?? []).map(r => r.activity_id)
    const hostedIds = (hostedActs ?? []).map(a => a.id)
    const allIds = [...new Set([...participatingIds, ...hostedIds])]

    if (allIds.length > 0) {
      // Build title map
      const titleMap: Record<string, string> = {}
      ;(acceptedReqs ?? []).forEach(r => {
        const act = r.activities as { title: string } | null
        if (act) titleMap[r.activity_id] = act.title
      })
      ;(hostedActs ?? []).forEach(a => { titleMap[a.id] = a.title })

      // Recent messages from others
      const { data: msgData } = await supabase
        .from('activity_messages')
        .select('id, content, created_at, activity_id, user_id, user_profiles!inner(name, avatar_url)')
        .in('activity_id', allIds)
        .neq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (msgData) {
        setMessages(msgData.map(m => {
          const prof = m.user_profiles as { name: string; avatar_url: string | null } | null
          return {
            id: m.id,
            content: m.content,
            created_at: m.created_at,
            activity_id: m.activity_id,
            activity_title: titleMap[m.activity_id] ?? 'Aktivität',
            sender_name: prof?.name ?? 'Jemand',
            sender_avatar: prof?.avatar_url ?? null,
          }
        }))
      }
    }

    setLoading(false)
  }

  function isNew(dateStr: string) {
    return dateStr > lastSeen
  }

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'gerade eben'
    if (diffMins < 60) return `vor ${diffMins} Min`
    const diffH = Math.floor(diffMins / 60)
    if (diffH < 24) return `vor ${diffH} Std`
    const diffD = Math.floor(diffH / 24)
    return `vor ${diffD} Tag${diffD > 1 ? 'en' : ''}`
  }

  function catEmoji(category: string) {
    return ACTIVITY_CATEGORIES.find(c => c.label === category)?.emoji ?? '📌'
  }

  const statusConfig = {
    accepted: { icon: '✅', label: 'Angenommen!', color: '#16A34A', bg: '#DCFCE7', border: '#BBF7D0' },
    rejected: { icon: '❌', label: 'Abgelehnt', color: '#DC2626', bg: '#FEE2E2', border: '#FECACA' },
    pending:  { icon: '⏳', label: 'Ausstehend', color: '#D97706', bg: '#FEF9C3', border: '#FEF08A' },
  }

  const allEmpty = requests.length === 0 && messages.length === 0

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="sticky top-0 z-10"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <span className="text-xl font-black tracking-tight flex-1">
            <span className="text-gray-900">Benachrich</span><span style={{ color: 'var(--accent)' }}>tigungen</span>
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-6">

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        )}

        {!loading && allEmpty && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl bg-violet-50">🔔</div>
            <div>
              <h3 className="text-lg font-black text-gray-900">Alles auf dem neuesten Stand</h3>
              <p className="text-sm text-gray-500 mt-1">Neue Benachrichtigungen erscheinen hier.</p>
            </div>
          </div>
        )}

        {/* Anfragen-Status */}
        {!loading && requests.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">Deine Anfragen</h2>
            {requests.map(r => {
              const cfg = statusConfig[r.status]
              const _isNew = isNew(r.updated_at)
              return (
                <button key={r.id} onClick={() => navigate(`/activity/${r.activity_id}`)}
                  className="press w-full bg-white rounded-3xl p-4 text-left transition-all hover:shadow-md card-shadow"
                  style={{ border: `1px solid ${_isNew ? cfg.border : 'var(--border)'}` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: cfg.bg }}>
                      {catEmoji(r.activity_category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {cfg.icon} {cfg.label}
                        </span>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">{formatTime(r.updated_at)}</span>
                      </div>
                      <p className="text-sm font-bold text-gray-900 mt-1.5 leading-snug truncate">
                        {r.activity_title}
                      </p>
                      {r.activity_date && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(r.activity_date).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} Uhr
                        </p>
                      )}
                    </div>
                    {_isNew && (
                      <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Chat-Nachrichten */}
        {!loading && messages.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 px-1">Neue Nachrichten</h2>
            {messages.map(m => {
              const _isNew = isNew(m.created_at)
              return (
                <button key={m.id} onClick={() => navigate(`/activity/${m.activity_id}`)}
                  className="press w-full bg-white rounded-3xl p-4 text-left transition-all hover:shadow-md card-shadow"
                  style={{ border: `1px solid ${_isNew ? '#DDD6FE' : 'var(--border)'}` }}>
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-2xl flex-shrink-0 overflow-hidden border border-gray-100">
                      {m.sender_avatar
                        ? <img src={m.sender_avatar} alt={m.sender_name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm font-black text-white"
                            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                            {m.sender_name[0]}
                          </div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">{m.sender_name}</span>
                        <span className="text-[11px] text-gray-400">{formatTime(m.created_at)}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate">{m.content}</p>
                      <p className="text-xs text-violet-600 font-bold truncate mt-0.5">💬 {m.activity_title}</p>
                    </div>
                    {_isNew && (
                      <div className="w-2 h-2 rounded-full bg-violet-500 flex-shrink-0" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
