import { useEffect, useState, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { DivIcon } from 'leaflet'
import { useNavigate } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import { BottomNav } from '../components/layout/bottom-nav'
import { type Activity } from '../types'
import { supabase } from '../lib/supabase'
import { getCategoryClass, getUrgencyLabel, haversineKm, formatDistance, isWithinHours } from '../lib/utils'
import { ACTIVITY_CATEGORIES, VIBES } from '../lib/constants'

const DEFAULT_CENTER: [number, number] = [52.52, 13.405]

type FeedTab = 'map' | 'now' | 'list'

interface FeedPageProps {
  pendingCount?: number
}

// Pans map to selected activity
function MapPanner({ center }: { center: [number, number] | null }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.flyTo(center, 15, { duration: 0.6 })
  }, [center?.toString()])
  return null
}

function makePin(color: string, selected: boolean, isNow: boolean = false) {
  const size = selected ? 40 : 32
  const radarHtml = isNow ? `
    <div class="radar-ring" style="
      position:absolute;
      inset:-10px;
      border-radius:50%;
      background:${color}22;
      border:2px solid ${color}88;
      pointer-events:none;
    "></div>` : ''
  return new DivIcon({
    html: `<div style="position:relative;width:${size}px;height:${size}px;">
      ${radarHtml}
      <div style="
        width:${size}px;
        height:${size}px;
        background:${color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        transition:all 0.2s;
      "></div>
    </div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  })
}

const CAT_COLORS: Record<string, string> = {
  'Sport': '#EF4444',
  'Outdoor': '#22C55E',
  'Essen & Trinken': '#F97316',
  'Kultur & Kunst': '#8B5CF6',
  'Musik': '#EC4899',
  'Gaming': '#3B82F6',
  'Reisen': '#14B8A6',
  'Lernen': '#EAB308',
  'Sonstiges': '#94A3B8',
}

export function FeedPage({ pendingCount = 0 }: FeedPageProps) {
  const navigate = useNavigate()
  const [activities, setActivities] = useState<Activity[]>([])
  const [tab, setTab] = useState<FeedTab>('map')
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [vibeFilter, setVibeFilter] = useState('')
  const [distanceKm, setDistanceKm] = useState(50)
  const [showFilters, setShowFilters] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const cardStripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos =>
      setUserPos([pos.coords.latitude, pos.coords.longitude])
    )
    supabase
      .from('activities')
      .select('*')
      .in('status', ['open', 'full'])
      .order('date_time', { ascending: true })
      .then(({ data }) => {
        const list = data ?? []
        setActivities(list)
        if (list.length > 0) setSelectedActivity(list[0])
      })
  }, [])

  const filtered = useMemo(() => {
    let list = activities.filter(a => a.status !== 'cancelled')

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.location_name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      )
    }
    if (categoryFilter) list = list.filter(a => a.category === categoryFilter)
    if (vibeFilter) list = list.filter(a => a.vibe === vibeFilter)

    if (userPos && distanceKm < 50) {
      list = list.filter(a => haversineKm(userPos[0], userPos[1], a.lat, a.lng) <= distanceKm)
    }

    return list
  }, [activities, search, categoryFilter, vibeFilter, distanceKm, userPos])

  const nowActivities = useMemo(() =>
    activities.filter(a => isWithinHours(a.date_time, 2) && a.status !== 'cancelled'),
    [activities]
  )

  const mapCenter = userPos ?? DEFAULT_CENTER

  // Sync card strip scroll to selectedActivity
  function handleCardScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const cardW = el.scrollWidth / filtered.length
    const idx = Math.round(el.scrollLeft / cardW)
    if (filtered[idx] && filtered[idx].id !== selectedActivity?.id) {
      setSelectedActivity(filtered[idx])
    }
  }

  function scrollToActivity(activity: Activity) {
    const idx = filtered.findIndex(a => a.id === activity.id)
    if (idx < 0 || !cardStripRef.current) return
    const cardW = cardStripRef.current.scrollWidth / filtered.length
    cardStripRef.current.scrollTo({ left: idx * cardW, behavior: 'smooth' })
    setSelectedActivity(activity)
  }

  const HEADER_H = showFilters ? 120 : 56

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="sticky top-0 z-20"
        style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-2">
          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Aktivitäten suchen..."
                className="flex-1 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-900 bg-gray-100 outline-none placeholder:text-gray-400" />
              <button onClick={() => { setShowSearch(false); setSearch('') }}
                className="text-sm font-bold text-violet-600">Fertig</button>
            </div>
          ) : (
            <>
              <span className="text-xl font-black tracking-tight flex-1">
                <span className="text-gray-900">plus</span><span style={{ color: 'var(--accent)' }}>1</span>
              </span>

              {/* Tab switcher */}
              <div className="flex p-0.5 rounded-xl gap-0.5 bg-gray-100">
                {([
                  { key: 'map', label: '🗺 Karte' },
                  { key: 'now', label: '⚡ Jetzt', badge: nowActivities.length },
                  { key: 'list', label: '☰ Liste' },
                ] as const).map(t => (
                  <button key={t.key} onClick={() => setTab(t.key)}
                    className="relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                    style={tab === t.key
                      ? { background: 'white', color: 'var(--accent)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                      : { color: 'var(--text-3)' }}>
                    {t.label}
                    {'badge' in t && t.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                        {t.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => setShowSearch(true)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button onClick={() => setShowFilters(f => !f)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${showFilters ? 'bg-violet-100 text-violet-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="max-w-lg mx-auto px-4 pb-3 flex flex-col gap-2.5">
            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
              <button onClick={() => setCategoryFilter('')}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-all"
                style={categoryFilter === ''
                  ? { background: '#0A0A0B', color: 'white', borderColor: '#0A0A0B' }
                  : { background: 'white', color: 'var(--text-3)', borderColor: 'var(--border)' }}>
                Alle
              </button>
              {ACTIVITY_CATEGORIES.map(cat => (
                <button key={cat.label} onClick={() => setCategoryFilter(cat.label === categoryFilter ? '' : cat.label)}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all"
                  style={categoryFilter === cat.label
                    ? { background: '#0A0A0B', color: 'white', borderColor: '#0A0A0B' }
                    : { background: 'white', color: 'var(--text-3)', borderColor: 'var(--border)' }}>
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            {/* Vibe chips */}
            <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
              <button onClick={() => setVibeFilter('')}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-all"
                style={vibeFilter === ''
                  ? { background: '#0A0A0B', color: 'white', borderColor: '#0A0A0B' }
                  : { background: 'white', color: 'var(--text-3)', borderColor: 'var(--border)' }}>
                Alle Vibes
              </button>
              {VIBES.map(v => (
                <button key={v.label} onClick={() => setVibeFilter(vibeFilter === v.label ? '' : v.label)}
                  className="flex-shrink-0 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all"
                  style={vibeFilter === v.label
                    ? { background: v.bg, color: v.color, borderColor: v.border }
                    : { background: 'white', color: 'var(--text-3)', borderColor: 'var(--border)' }}>
                  {v.emoji} {v.label}
                </button>
              ))}
            </div>

            {/* Distance slider */}
            {userPos && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 flex-shrink-0">Entfernung</span>
                <input type="range" min={1} max={50} value={distanceKm}
                  onChange={e => setDistanceKm(Number(e.target.value))}
                  className="flex-1 accent-violet-600" />
                <span className="text-xs font-black text-violet-600 w-12 text-right flex-shrink-0">
                  {distanceKm === 50 ? 'Alle' : `≤ ${distanceKm} km`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MAP TAB ── */}
      {tab === 'map' && (
        <div className="relative" style={{ height: `calc(100svh - ${HEADER_H}px - 64px)` }}>
          <MapContainer
            center={mapCenter} zoom={13}
            className="w-full h-full"
            zoomControl={false}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org/">OpenStreetMap</a>'
            />
            <MapPanner center={selectedActivity ? [selectedActivity.lat, selectedActivity.lng] : null} />
            {filtered.map(a => {
              const isSelected = a.id === selectedActivity?.id
              const color = CAT_COLORS[a.category] ?? '#7C3AED'
              const isNow = isWithinHours(a.date_time, 2)
              return (
                <Marker key={a.id} position={[a.lat, a.lng]}
                  icon={makePin(color, isSelected, isNow)}
                  eventHandlers={{ click: () => scrollToActivity(a) }}>
                  <Popup>
                    <div className="text-sm font-sans">
                      <div className="font-bold">{a.title}</div>
                      <div className="text-gray-500 text-xs">{a.spots_total - a.spots_taken} Plätze frei</div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>

          {/* Bottom card strip */}
          {filtered.length > 0 && (
            <div
              ref={cardStripRef}
              onScroll={handleCardScroll}
              className="absolute bottom-3 left-0 right-0 flex gap-3 overflow-x-auto px-4"
              style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
              {filtered.map(a => (
                <MapCard key={a.id} activity={a} userPos={userPos}
                  selected={a.id === selectedActivity?.id}
                  onClick={() => navigate(`/activity/${a.id}`)} />
              ))}
              {/* Trailing spacer */}
              <div className="flex-shrink-0 w-1" />
            </div>
          )}

          {filtered.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white rounded-3xl px-6 py-4 text-center card-shadow">
                <p className="text-2xl mb-1">🔍</p>
                <p className="text-sm font-bold text-gray-700">Keine Aktivitäten gefunden</p>
                <p className="text-xs text-gray-400">Filter anpassen</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── JETZT SOFORT TAB ── */}
      {tab === 'now' && (
        <div className="max-w-lg mx-auto px-4 py-4 pb-28 flex flex-col gap-4">
          {/* Hero banner */}
          <div className="rounded-3xl p-5 text-white relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
            <div className="text-3xl mb-2">⚡</div>
            <h2 className="text-xl font-black mb-1">Jetzt sofort</h2>
            <p className="text-white/70 text-sm">Activities die in den nächsten 2 Stunden starten.</p>
            {nowActivities.length > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-black">{nowActivities.length} aktiv jetzt</span>
              </div>
            )}
          </div>

          {nowActivities.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl bg-violet-50">😴</div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Gerade nichts los</h3>
                <p className="text-sm text-gray-500 mt-1">Starte selbst eine spontane Aktivität!</p>
              </div>
              <button onClick={() => navigate('/create')}
                className="press px-6 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 4px 14px rgba(124,58,237,0.35)' }}>
                Aktivität erstellen ⚡
              </button>
            </div>
          ) : (
            nowActivities.map((a, i) => (
              <NowCard key={a.id} activity={a} userPos={userPos}
                onClick={() => navigate(`/activity/${a.id}`)}
                style={{ animationDelay: `${i * 0.05}s` }} />
            ))
          )}
        </div>
      )}

      {/* ── LIST TAB ── */}
      {tab === 'list' && (
        <div className="max-w-lg mx-auto px-4 py-4 pb-28 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center animate-fade-up">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl bg-violet-50">⚡</div>
              <div>
                <h2 className="text-lg font-black text-gray-900">Noch nichts los</h2>
                <p className="text-sm mt-1 text-gray-500">Sei der Erste — post eine Aktivität!</p>
              </div>
            </div>
          ) : (
            filtered.map((a, i) => (
              <div key={a.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                <ListCard activity={a} userPos={userPos} onClick={() => navigate(`/activity/${a.id}`)} />
              </div>
            ))
          )}
        </div>
      )}

      <BottomNav pendingCount={pendingCount} />
    </div>
  )
}

// ── MAP BOTTOM CARD ──
function MapCard({ activity: a, userPos, selected, onClick }: {
  activity: Activity; userPos: [number, number] | null; selected: boolean; onClick: () => void
}) {
  const spotsLeft = a.spots_total - a.spots_taken
  const isToday = new Date(a.date_time).toDateString() === new Date().toDateString()
  const timeStr = new Date(a.date_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const dist = userPos ? haversineKm(userPos[0], userPos[1], a.lat, a.lng) : null
  const catClass = getCategoryClass(a.category)
  const urgency = getUrgencyLabel(a.date_time)
  const vibeInfo = VIBES.find(v => v.label === a.vibe)

  return (
    <div onClick={onClick}
      className="press flex-shrink-0 bg-white rounded-3xl p-4 cursor-pointer transition-all duration-200"
      style={{
        width: 'min(85vw, 320px)',
        scrollSnapAlign: 'center',
        border: selected ? '2px solid #7C3AED' : '1px solid var(--border)',
        boxShadow: selected ? '0 4px 20px rgba(124,58,237,0.2)' : '0 2px 8px rgba(0,0,0,0.08)',
      }}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className={`${catClass} text-xs font-bold px-2.5 py-1 rounded-full border`}>{a.category}</span>
          {vibeInfo && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full border"
              style={{ background: vibeInfo.bg, color: vibeInfo.color, borderColor: vibeInfo.border }}>
              {vibeInfo.emoji} {vibeInfo.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {urgency && <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">{urgency}</span>}
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${spotsLeft > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
            {spotsLeft > 0 ? `${spotsLeft} frei` : 'Voll'}
          </span>
        </div>
      </div>
      <h3 className="text-sm font-bold text-gray-900 leading-snug mb-2">{a.title}</h3>
      <div className="flex items-center justify-between text-xs text-gray-500 font-semibold">
        <span className={isToday ? 'text-violet-600 font-bold' : ''}>{isToday ? 'Heute' : new Date(a.date_time).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })} · {timeStr}</span>
        {dist !== null && <span>{formatDistance(dist)} entfernt</span>}
      </div>
    </div>
  )
}

// ── JETZT SOFORT CARD ──
function NowCard({ activity: a, userPos, onClick, style }: {
  activity: Activity; userPos: [number, number] | null; onClick: () => void; style?: React.CSSProperties
}) {
  const spotsLeft = a.spots_total - a.spots_taken
  const timeStr = new Date(a.date_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const dist = userPos ? haversineKm(userPos[0], userPos[1], a.lat, a.lng) : null
  const catClass = getCategoryClass(a.category)
  const diff = new Date(a.date_time).getTime() - Date.now()
  const minsLeft = Math.max(0, Math.floor(diff / 60000))

  return (
    <div onClick={onClick}
      className="press bg-white rounded-3xl p-5 cursor-pointer card-shadow animate-fade-up transition-all hover:shadow-md"
      style={{ border: '1px solid var(--border)', ...style }}>
      <div className="flex items-center justify-between mb-3">
        <span className={`${catClass} text-xs font-bold px-3 py-1 rounded-full border`}>{a.category}</span>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-black text-red-500">
            {minsLeft === 0 ? 'Jetzt!' : `${minsLeft} min`}
          </span>
        </div>
      </div>
      <h3 className="text-base font-black text-gray-900 mb-3">{a.title}</h3>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timeStr} Uhr
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {a.location_name}
            {dist !== null && <span className="text-violet-600 font-bold ml-1">· {formatDistance(dist)}</span>}
          </div>
        </div>
        <span className={`text-sm font-black px-3 py-1.5 rounded-full border
          ${spotsLeft > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
          {spotsLeft > 0 ? `${spotsLeft} Plätze frei` : 'Voll'}
        </span>
      </div>
    </div>
  )
}

// ── LIST CARD ──
function ListCard({ activity: a, userPos, onClick }: {
  activity: Activity; userPos: [number, number] | null; onClick: () => void
}) {
  const spotsLeft = a.spots_total - a.spots_taken
  const urgency = getUrgencyLabel(a.date_time)
  const catClass = getCategoryClass(a.category)
  const isToday = new Date(a.date_time).toDateString() === new Date().toDateString()
  const dateStr = isToday ? 'Heute' : new Date(a.date_time).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = new Date(a.date_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const dist = userPos ? haversineKm(userPos[0], userPos[1], a.lat, a.lng) : null
  const colors = ['#7C3AED', '#EC4899', '#06B6D4', '#F59E0B']
  const takenCount = Math.min(a.spots_taken, 4)
  const vibeInfo = VIBES.find(v => v.label === a.vibe)

  return (
    <div onClick={onClick}
      className="press rounded-3xl p-5 flex flex-col gap-3 cursor-pointer bg-white card-shadow transition-all hover:shadow-md"
      style={{ border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className={`${catClass} text-xs font-bold px-3 py-1 rounded-full border`}>{a.category}</span>
          {vibeInfo && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full border"
              style={{ background: vibeInfo.bg, color: vibeInfo.color, borderColor: vibeInfo.border }}>
              {vibeInfo.emoji} {vibeInfo.label}
            </span>
          )}
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${spotsLeft > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
          {spotsLeft > 0 ? `${spotsLeft} frei` : 'Voll'}
        </span>
      </div>
      <h3 className="text-base font-bold text-gray-900 leading-snug">{a.title}</h3>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={isToday ? 'text-violet-600 font-bold' : ''}>{dateStr}</span>
            <span className="text-gray-300">·</span>
            <span>{timeStr} Uhr</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="truncate max-w-[120px]">{a.location_name}</span>
            {dist !== null && <span className="text-violet-600 font-bold">· {formatDistance(dist)}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {urgency && <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">{urgency}</span>}
          {takenCount > 0 && (
            <div className="flex items-center">
              {Array.from({ length: takenCount }).map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-full border-2 border-white -ml-1.5 first:ml-0"
                  style={{ background: colors[i % colors.length], zIndex: takenCount - i }} />
              ))}
              <span className="ml-1.5 text-xs font-bold text-gray-400">dabei</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
