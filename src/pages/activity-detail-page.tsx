import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { type Activity, type UserProfile, type ActivityRequestWithProfile, type ChatMessageWithProfile } from '../types'
import { Button } from '../components/ui/button'
import { getCategoryClass, getUrgencyLabel } from '../lib/utils'
import { SwipeCard } from '../components/features/swipe-card'

interface ActivityDetailPageProps {
  userId: string
}

export function ActivityDetailPage({ userId }: ActivityDetailPageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [activity, setActivity] = useState<Activity | null>(null)
  const [hostProfile, setHostProfile] = useState<UserProfile | null>(null)
  const [requests, setRequests] = useState<ActivityRequestWithProfile[]>([])
  const [myRequest, setMyRequest] = useState<{ id: string; status: string } | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [tab, setTab] = useState<'info' | 'chat'>('info')
  const [messages, setMessages] = useState<ChatMessageWithProfile[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const [toast, setToast] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const isHost = activity?.host_id === userId
  const spotsLeft = activity ? activity.spots_total - activity.spots_taken : 0
  const canChat = isHost || myRequest?.status === 'accepted'

  useEffect(() => {
    if (!id) return
    fetchAll()
  }, [id])

  // Realtime subscription for new requests (host) and chat messages
  useEffect(() => {
    if (!id || !activity) return

    const channel = supabase
      .channel(`activity:${id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_messages', filter: `activity_id=eq.${id}` },
        async payload => {
          const newMsg = payload.new as { id: string; activity_id: string; user_id: string; content: string; created_at: string }
          const { data: prof } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', newMsg.user_id)
            .single()
          setMessages(msgs => [...msgs, { ...newMsg, profile: prof }])
          setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'activity_requests', filter: `activity_id=eq.${id}` },
        () => { fetchAll() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id, activity?.id])

  // Scroll chat to bottom when switching to chat tab
  useEffect(() => {
    if (tab === 'chat') {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [tab])

  async function fetchAll() {
    setLoading(true)

    const { data: act } = await supabase.from('activities').select('*').eq('id', id).single()
    if (!act) { navigate('/feed'); return }
    setActivity(act)

    const { data: host } = await supabase.from('user_profiles').select('*').eq('user_id', act.host_id).single()
    setHostProfile(host)

    const { data: mine } = await supabase
      .from('activity_requests').select('id, status').eq('activity_id', id).eq('user_id', userId).single()
    setMyRequest(mine)

    if (act.host_id === userId) {
      const { data: reqs } = await supabase
        .from('activity_requests').select('*').eq('activity_id', id).order('created_at', { ascending: true })

      if (reqs?.length) {
        const { data: profiles } = await supabase.from('user_profiles').select('*').in('user_id', reqs.map(r => r.user_id))
        const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p]))
        setRequests(reqs.map(r => ({ ...r, profile: profileMap[r.user_id] })))
      }
    }

    // Load chat messages
    const myReqCheck = await supabase
      .from('activity_requests').select('status').eq('activity_id', id).eq('user_id', userId).single()
    const canLoadChat = act.host_id === userId || myReqCheck.data?.status === 'accepted'

    if (canLoadChat) {
      const { data: msgs } = await supabase
        .from('activity_messages').select('*').eq('activity_id', id).order('created_at', { ascending: true })

      if (msgs?.length) {
        const userIds = [...new Set(msgs.map(m => m.user_id))]
        const { data: profiles } = await supabase.from('user_profiles').select('*').in('user_id', userIds)
        const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p]))
        setMessages(msgs.map(m => ({ ...m, profile: profileMap[m.user_id] ?? null })))
      }
    }

    setLoading(false)
  }

  async function sendRequest() {
    if (!id) return
    setSending(true)
    const { data, error } = await supabase
      .from('activity_requests')
      .insert({ activity_id: id, user_id: userId, message: message.trim() || null })
      .select('id, status').single()
    if (!error && data) setMyRequest(data)
    setSending(false)
  }

  async function withdrawRequest() {
    if (!myRequest) return
    setSending(true)
    await supabase.from('activity_requests').delete().eq('id', myRequest.id)
    setMyRequest(null)
    setSending(false)
  }

  async function acceptRequest(requestId: string) {
    if (!activity) return
    setActionId(requestId)
    await supabase.from('activity_requests').update({ status: 'accepted' }).eq('id', requestId)
    const newTaken = activity.spots_taken + 1
    const newStatus = newTaken >= activity.spots_total ? 'full' : 'open'
    await supabase.from('activities').update({ spots_taken: newTaken, status: newStatus }).eq('id', activity.id)
    setActivity(a => a ? { ...a, spots_taken: newTaken, status: newStatus } : a)
    setRequests(rs => rs.map(r => r.id === requestId ? { ...r, status: 'accepted' } : r))
    setActionId(null)
  }

  async function rejectRequest(requestId: string) {
    setActionId(requestId)
    await supabase.from('activity_requests').update({ status: 'rejected' }).eq('id', requestId)
    setRequests(rs => rs.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r))
    setActionId(null)
  }

  async function removeParticipant(requestId: string) {
    if (!activity) return
    setActionId(requestId)
    await supabase.from('activity_requests').update({ status: 'rejected' }).eq('id', requestId)
    const newTaken = Math.max(0, activity.spots_taken - 1)
    await supabase.from('activities').update({ spots_taken: newTaken, status: 'open' }).eq('id', activity.id)
    setActivity(a => a ? { ...a, spots_taken: newTaken, status: 'open' } : a)
    setRequests(rs => rs.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r))
    setActionId(null)
  }

  async function cancelActivity() {
    if (!activity || !window.confirm('Aktivität wirklich absagen?')) return
    setCancelling(true)
    await supabase.from('activities').update({ status: 'cancelled' }).eq('id', activity.id)
    setActivity(a => a ? { ...a, status: 'cancelled' } : a)
    setCancelling(false)
    showToast('Aktivität abgesagt.')
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || !id) return
    setChatSending(true)
    await supabase.from('activity_messages').insert({ activity_id: id, user_id: userId, content: chatInput.trim() })
    setChatInput('')
    setChatSending(false)
  }

  function shareActivity() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({ title: activity?.title, url })
    } else {
      navigator.clipboard.writeText(url)
      showToast('Link kopiert!')
    }
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-6 h-6 rounded-full border-2 border-violet-300 border-t-violet-600 animate-spin" />
      </div>
    )
  }

  if (!activity) return null

  const dateStr = new Date(activity.date_time).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })
  const timeStr = new Date(activity.date_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const acceptedRequests = requests.filter(r => r.status === 'accepted')
  const urgency = getUrgencyLabel(activity.date_time)
  const catClass = getCategoryClass(activity.category)
  const isCancelled = activity.status === 'cancelled'

  return (
    <div className="min-h-screen pb-6" style={{ background: 'var(--bg)' }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-up">
          <div className="px-4 py-2.5 rounded-2xl text-sm font-bold text-white shadow-lg"
            style={{ background: '#0A0A0B' }}>
            {toast}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="press w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-bold text-gray-900 truncate flex-1">{activity.title}</h1>
          <button onClick={shareActivity}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

        {/* Tabs — only if chat is available */}
        {canChat && (
          <div className="max-w-lg mx-auto px-4 pb-2 flex gap-2">
            {[
              { key: 'info' as const, label: 'Info' },
              { key: 'chat' as const, label: 'Chat', badge: messages.length },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition-all border"
                style={tab === t.key
                  ? { background: '#0A0A0B', color: 'white', borderColor: '#0A0A0B' }
                  : { background: 'white', color: 'var(--text-3)', borderColor: 'var(--border)' }
                }>
                {t.label}
                {(t.badge ?? 0) > 0 && tab !== t.key && (
                  <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center">
                    {(t.badge ?? 0) > 9 ? '9+' : t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Chat Tab */}
      {tab === 'chat' && canChat && (
        <div className="max-w-lg mx-auto flex flex-col" style={{ height: 'calc(100svh - 120px)' }}>
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <div className="text-4xl">💬</div>
                <p className="text-sm font-semibold text-gray-500">Noch keine Nachrichten.<br />Schreib als Erster!</p>
              </div>
            )}
            {messages.map(msg => {
              const isMe = msg.user_id === userId
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border border-gray-100">
                      {msg.profile?.avatar_url
                        ? <img src={msg.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-xs font-black text-white"
                            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
                            {msg.profile?.name?.[0] ?? '?'}
                          </div>
                      }
                    </div>
                  )}
                  <div className={`max-w-[70%] flex flex-col gap-0.5 ${isMe ? 'items-end' : ''}`}>
                    {!isMe && <span className="text-[10px] font-bold text-gray-400 px-1">{msg.profile?.name ?? 'Unbekannt'}</span>}
                    <div className={`px-3.5 py-2 rounded-2xl text-sm font-medium leading-relaxed ${isMe
                      ? 'text-white rounded-tr-sm'
                      : 'text-gray-900 bg-white border border-gray-100 rounded-tl-sm'}`}
                      style={isMe ? { background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' } : {}}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-400 px-1">
                      {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Chat input */}
          <div className="px-4 pb-4 pt-2 flex gap-2 bg-white border-t border-gray-100">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage() } }}
              placeholder="Nachricht..."
              maxLength={500}
              className="flex-1 px-4 py-2.5 rounded-2xl text-sm font-medium text-gray-900 bg-gray-100 outline-none placeholder:text-gray-400 focus:bg-gray-50 focus:shadow-[0_0_0_2px_rgba(124,58,237,0.15)]"
            />
            <button onClick={sendChatMessage} disabled={!chatInput.trim() || chatSending}
              className="press w-10 h-10 rounded-2xl flex items-center justify-center text-white disabled:opacity-40 transition-all"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Info Tab */}
      {tab === 'info' && (
        <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-3 animate-fade-up">

          {/* Cancelled banner */}
          {isCancelled && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm font-bold text-red-600">
              ❌ Diese Aktivität wurde abgesagt.
            </div>
          )}

          {/* Activity card */}
          <div className="bg-white rounded-3xl p-5 flex flex-col gap-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <span className={`${catClass} text-xs font-bold px-3 py-1 rounded-full border`}>{activity.category}</span>
              <div className="flex items-center gap-2">
                {urgency && !isCancelled && (
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">{urgency}</span>
                )}
                <span className={`text-xs font-bold px-3 py-1 rounded-full border
                  ${isCancelled ? 'bg-red-50 text-red-500 border-red-100' :
                    activity.status === 'open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    'bg-gray-100 text-gray-400 border-gray-200'}`}>
                  {isCancelled ? 'Abgesagt' : activity.status === 'open' ? `${spotsLeft} frei` : 'Voll'}
                </span>
              </div>
            </div>

            <h2 className="text-xl font-black text-gray-900 leading-tight">{activity.title}</h2>

            {activity.description && (
              <p className="text-sm leading-relaxed text-gray-600">{activity.description}</p>
            )}

            <div className="flex flex-col gap-3 pt-3 border-t border-gray-100">
              {[
                { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Wann', value: `${dateStr}, ${timeStr} Uhr` },
                { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', label: 'Wo', value: activity.location_name },
                { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0', label: 'Dabei', value: `${activity.spots_taken} von ${activity.spots_total}` },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 bg-violet-50">
                    <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{item.label}</div>
                    <div className="text-sm font-semibold text-gray-900">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Host */}
          {hostProfile && (
            <div className="bg-white rounded-3xl p-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
              <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400">Organisiert von</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
                  {hostProfile.avatar_url
                    ? <img src={hostProfile.avatar_url} alt={hostProfile.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-lg font-black text-white"
                        style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>{hostProfile.name[0]}</div>
                  }
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{hostProfile.name}</div>
                  {hostProfile.city && <div className="text-xs text-gray-500">{hostProfile.city}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Guest: Anfrage senden */}
          {!isHost && !isCancelled && (
            <div className="bg-white rounded-3xl p-5 flex flex-col gap-3 card-shadow" style={{ border: '1px solid var(--border)' }}>
              {!myRequest && (
                <>
                  <h3 className="text-base font-black text-gray-900">Dabei sein? ✋</h3>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Kurze Nachricht (optional)..."
                    rows={2}
                    maxLength={200}
                    className="w-full px-4 py-3 rounded-2xl text-sm font-medium text-gray-900 resize-none bg-gray-50 border border-gray-200 placeholder:text-gray-400 outline-none focus:border-violet-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]"
                  />
                  <Button onClick={sendRequest} loading={sending} disabled={activity.status !== 'open'} size="lg" className="w-full">
                    {activity.status === 'open' ? 'Anfrage senden' : 'Leider schon voll'}
                  </Button>
                </>
              )}
              {myRequest?.status === 'pending' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-amber-600">⏳ Warte auf Bestätigung</span>
                  <button onClick={withdrawRequest} className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">Zurückziehen</button>
                </div>
              )}
              {myRequest?.status === 'accepted' && (
                <div className="text-sm font-bold text-emerald-600">✅ Du bist dabei! Schreib im Chat.</div>
              )}
              {myRequest?.status === 'rejected' && (
                <div className="text-sm font-semibold text-red-500">❌ Anfrage abgelehnt.</div>
              )}
            </div>
          )}

          {/* Host: Anfragen management */}
          {isHost && (
            <>
              {pendingRequests.length > 0 && (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-sm font-black text-gray-900">Neue Anfragen</h3>
                    <span className="w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center bg-violet-600">{pendingRequests.length}</span>
                  </div>
                  {pendingRequests.map(req => (
                    <SwipeCard key={req.id}
                      profile={req.profile}
                      message={req.message}
                      loading={actionId === req.id}
                      onAccept={() => acceptRequest(req.id)}
                      onReject={() => rejectRequest(req.id)} />
                  ))}
                </div>
              )}
              {acceptedRequests.length > 0 && (
                <div className="bg-white rounded-3xl p-4 flex flex-col gap-4 card-shadow" style={{ border: '1px solid #BBF7D0' }}>
                  <h3 className="text-sm font-black text-gray-900">Teilnehmer ✅</h3>
                  <div className="flex flex-col gap-3">
                    {acceptedRequests.map(req => (
                      <ParticipantRow key={req.id} req={req} loading={actionId === req.id} onRemove={() => removeParticipant(req.id)} />
                    ))}
                  </div>
                </div>
              )}
              {pendingRequests.length === 0 && acceptedRequests.length === 0 && (
                <div className="bg-white rounded-3xl p-6 text-center card-shadow" style={{ border: '1px solid var(--border)' }}>
                  <p className="text-3xl mb-2">👀</p>
                  <p className="text-sm text-gray-500">Noch keine Anfragen.</p>
                </div>
              )}

              {/* Cancel activity */}
              {!isCancelled && (
                <button onClick={cancelActivity} disabled={cancelling}
                  className="press w-full py-3 rounded-2xl text-sm font-bold text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all disabled:opacity-50">
                  {cancelling ? 'Wird abgesagt…' : 'Aktivität absagen'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Avatar({ url, name }: { url?: string | null; name?: string }) {
  return url
    ? <img src={url} alt={name} className="w-full h-full object-cover" />
    : <div className="w-full h-full flex items-center justify-center text-sm font-black text-white"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>{name?.[0] ?? '?'}</div>
}

function RequestRow({ req, loading, onAccept, onReject }: {
  req: ActivityRequestWithProfile; loading: boolean; onAccept: () => void; onReject: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
        <Avatar url={req.profile?.avatar_url} name={req.profile?.name} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-900">{req.profile?.name ?? 'Unbekannt'}</div>
        {req.message && <div className="text-xs text-gray-500 mt-0.5">„{req.message}"</div>}
      </div>
      <div className="flex gap-2">
        <button onClick={onReject} disabled={loading}
          className="press w-9 h-9 rounded-xl flex items-center justify-center text-red-500 bg-red-50 border border-red-100">✕</button>
        <button onClick={onAccept} disabled={loading}
          className="press w-9 h-9 rounded-xl flex items-center justify-center text-emerald-600 bg-emerald-50 border border-emerald-100">✓</button>
      </div>
    </div>
  )
}

function ParticipantRow({ req, loading, onRemove }: {
  req: ActivityRequestWithProfile; loading: boolean; onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100">
        <Avatar url={req.profile?.avatar_url} name={req.profile?.name} />
      </div>
      <div className="flex-1 text-sm font-bold text-gray-900">{req.profile?.name ?? 'Unbekannt'}</div>
      <button onClick={onRemove} disabled={loading}
        className="text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors">
        Entfernen
      </button>
    </div>
  )
}
