import { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Icon } from 'leaflet'
import { useNavigate } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import { BottomNav } from '../components/layout/bottom-nav'
import { type Activity } from '../types'
import { supabase } from '../lib/supabase'
import { getCategoryClass, getUrgencyLabel } from '../lib/utils'
import { ACTIVITY_CATEGORIES } from '../lib/constants'

const markerIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
})

const DEFAULT_CENTER: [number, number] = [52.52, 13.405]

const TIME_FILTERS = [
  { key: 'all', label: 'Alle' },
  { key: 'today', label: 'Heute' },
  { key: 'week', label: 'Diese Woche' },
]

interface FeedPageProps {
  pendingCount?: number
}

export function FeedPage({ pendingCount = 0 }: FeedPageProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [view, setView] = useState<'list' | 'map'>('list')
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState('all')
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(pos =>
      setUserPos([pos.coords.latitude, pos.coords.longitude])
    )
    supabase
      .from('activities')
      .select('*')
      .in('status', ['open', 'full'])
      .order('date_time', { ascending: true })
      .then(({ data }) => setActivities(data ?? []))
  }, [])

  const filtered = useMemo(() => {
    let list = activities
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.location_name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q)
      )
    }
    if (categoryFilter) {
      list = list.filter(a => a.category === categoryFilter)
    }
    if (timeFilter === 'today') {
      const today = new Date().toDateString()
      list = list.filter(a => new Date(a.date_time).toDateString() === today)
    } else if (timeFilter === 'week') {
      const now = new Date()
      const weekEnd = new Date(now)
      weekEnd.setDate(weekEnd.getDate() + 7)
      list = list.filter(a => {
        const d = new Date(a.date_time)
        return d >= now && d <= weekEnd
      })
    }
    return list
  }, [activities, search, categoryFilter, timeFilter])

  const mapCenter = userPos ?? DEFAULT_CENTER

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="sticky top-0 z-10"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">

          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Aktivitäten suchen..."
                className="flex-1 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-900 bg-gray-100 outline-none placeholder:text-gray-400"
              />
              <button onClick={() => { setShowSearch(false); setSearch('') }}
                className="text-sm font-semibold text-violet-600">
                Abbrechen
              </button>
            </div>
          ) : (
            <>
              <span className="text-xl font-black tracking-tight flex-1">
                <span className="text-gray-900">plus</span><span style={{ color: 'var(--accent)' }}>1</span>
              </span>

              <button onClick={() => setShowSearch(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <div className="flex p-1 rounded-xl gap-0.5 bg-gray-100">
                {(['list', 'map'] as const).map(v => (
                  <button key={v} onClick={() => setView(v)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                    style={view === v
                      ? { background: 'white', color: 'var(--accent)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
                      : { color: 'var(--text-3)' }
                    }>
                    {v === 'list' ? 'Liste' : 'Karte'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Filters — only in list view */}
        {view === 'list' && !showSearch && (
          <div className="max-w-lg mx-auto px-4 pb-3 flex flex-col gap-2">
            {/* Time filter */}
            <div className="flex gap-2">
              {TIME_FILTERS.map(f => (
                <button key={f.key} onClick={() => setTimeFilter(f.key)}
                  className="px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 border"
                  style={timeFilter === f.key
                    ? { background: '#EDE9FE', color: '#7C3AED', borderColor: '#DDD6FE' }
                    : { background: 'white', color: 'var(--text-3)', borderColor: 'var(--border)' }
                  }>
                  {f.label}
                </button>
              ))}
            </div>

            {/* Category filter — horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
              <button onClick={() => setCategoryFilter('')}
                className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 border"
                style={categoryFilter === ''
                  ? { background: '#0A0A0B', color: 'white', borderColor: '#0A0A0B' }
                  : { background: 'white', color: 'var(--text-3)', borderColor: 'var(--border)' }
                }>
                Alle
              </button>
              {ACTIVITY_CATEGORIES.map(cat => (
                <button key={cat.label} onClick={() => setCategoryFilter(cat.label === categoryFilter ? '' : cat.label)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 border"
                  style={categoryFilter === cat.label
                    ? { background: '#0A0A0B', color: 'white', borderColor: '#0A0A0B' }
                    : { background: 'white', color: 'var(--text-3)', borderColor: 'var(--border)' }
                  }>
                  <span>{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Map */}
      {view === 'map' && (
        <div className="h-[calc(100svh-56px-64px)]">
          <MapContainer center={mapCenter} zoom={13} className="w-full h-full">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='© <a href="https://openstreetmap.org/">OpenStreetMap</a>'
            />
            {filtered.map(a => (
              <Marker key={a.id} position={[a.lat, a.lng]} icon={markerIcon}>
                <Popup>
                  <div className="text-sm font-sans">
                    <div className="font-bold">{a.title}</div>
                    <div className="text-gray-500 text-xs">{a.category} · {a.spots_total - a.spots_taken} frei</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* List */}
      {view === 'list' && (
        <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center animate-fade-up">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl bg-violet-50">
                {categoryFilter ? ACTIVITY_CATEGORIES.find(c => c.label === categoryFilter)?.emoji ?? '🔍' : '⚡'}
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">
                  {search || categoryFilter || timeFilter !== 'all' ? 'Nichts gefunden' : 'Noch nichts los'}
                </h2>
                <p className="text-sm mt-1 text-gray-500">
                  {search || categoryFilter || timeFilter !== 'all'
                    ? 'Versuch andere Filter.'
                    : 'Sei der Erste — post eine Aktivität!'}
                </p>
              </div>
              {(categoryFilter || timeFilter !== 'all' || search) && (
                <button onClick={() => { setCategoryFilter(''); setTimeFilter('all'); setSearch('') }}
                  className="px-4 py-2 rounded-2xl text-sm font-bold text-violet-600 bg-violet-50 border border-violet-100">
                  Filter zurücksetzen
                </button>
              )}
            </div>
          ) : (
            filtered.map((a, i) => (
              <div key={a.id} className="animate-fade-up" style={{ animationDelay: `${i * 0.04}s`, opacity: 0 }}>
                <ActivityCard activity={a} />
              </div>
            ))
          )}
        </div>
      )}

      <BottomNav pendingCount={pendingCount} />
    </div>
  )
}

function ActivityCard({ activity: a }: { activity: Activity }) {
  const navigate = useNavigate()
  const spotsLeft = a.spots_total - a.spots_taken
  const urgency = getUrgencyLabel(a.date_time)
  const catClass = getCategoryClass(a.category)

  const isToday = new Date(a.date_time).toDateString() === new Date().toDateString()
  const dateStr = isToday
    ? 'Heute'
    : new Date(a.date_time).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })
  const timeStr = new Date(a.date_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

  const takenCount = Math.min(a.spots_taken, 4)
  const colors = ['#7C3AED', '#EC4899', '#06B6D4', '#F59E0B']

  const isCancelled = a.status === 'cancelled'

  return (
    <div
      onClick={() => navigate(`/activity/${a.id}`)}
      className={`press rounded-3xl p-5 flex flex-col gap-3 cursor-pointer bg-white transition-all duration-200 card-shadow hover:shadow-md ${isCancelled ? 'opacity-50' : ''}`}
      style={{ border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <span className={`${catClass} text-xs font-bold px-3 py-1 rounded-full border`}>
          {a.category}
        </span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border
          ${isCancelled
            ? 'bg-red-50 text-red-500 border-red-100'
            : spotsLeft > 0
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-gray-100 text-gray-400 border-gray-200'}`}>
          {isCancelled ? 'Abgesagt' : spotsLeft > 0 ? `${spotsLeft} frei` : 'Voll'}
        </span>
      </div>

      <h3 className="text-base font-bold text-gray-900 leading-snug">{a.title}</h3>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className={isToday ? 'text-violet-600 font-bold' : ''}>{dateStr}</span>
            <span className="text-gray-300">·</span>
            <span>{timeStr} Uhr</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            <span className="truncate max-w-[140px]">{a.location_name}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          {urgency && !isCancelled && (
            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              {urgency}
            </span>
          )}
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
