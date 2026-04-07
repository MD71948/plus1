import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ACTIVITY_CATEGORIES, VIBES } from '../lib/constants'
import { Button } from '../components/ui/button'
import { LocationSearch } from '../components/features/location-search'
import { BottomNav } from '../components/layout/bottom-nav'

interface SelectedLocation {
  name: string
  address: string
  lat: number
  lng: number
}

interface CreatePageProps {
  userId: string
}

const OUTDOOR_CATS = ['Sport', 'Outdoor', 'Reisen']

const TIME_PRESETS = [
  { label: '⚡ In 1h', hours: 1 },
  { label: '🕐 In 2h', hours: 2 },
  { label: '🌆 Heute Abend', hour: '19', sameDay: true },
  { label: '☀️ Morgen', tomorrow: true },
]

function getPresetValues(preset: typeof TIME_PRESETS[number]) {
  const now = new Date()
  if ('hours' in preset && preset.hours) {
    const t = new Date(now.getTime() + preset.hours * 3600000)
    return { date: t.toISOString().split('T')[0], hour: String(t.getHours()).padStart(2, '0'), minute: '00' }
  }
  if ('tomorrow' in preset && preset.tomorrow) {
    const t = new Date(now); t.setDate(t.getDate() + 1)
    return { date: t.toISOString().split('T')[0], hour: '12', minute: '00' }
  }
  return { date: now.toISOString().split('T')[0], hour: preset.hour ?? '19', minute: '00' }
}

export function CreatePage({ userId }: CreatePageProps) {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    vibe: '',
    date: '',
    hour: '18',
    minute: '00',
    spots_total: '2',
    visibility: 'public' as 'public' | 'followers' | 'friends',
  })
  const [location, setLocation] = useState<SelectedLocation | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [weatherWarning, setWeatherWarning] = useState<string | null>(null)
  const [showMore, setShowMore] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  // Weather check for outdoor categories
  useEffect(() => {
    if (!OUTDOOR_CATS.includes(form.category) || !form.date || !location) {
      setWeatherWarning(null); return
    }
    const diffDays = (new Date(form.date).getTime() - Date.now()) / 86400000
    if (diffDays < 0 || diffDays > 14) { setWeatherWarning(null); return }

    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&daily=precipitation_sum,weathercode&timezone=auto&start_date=${form.date}&end_date=${form.date}`)
      .then(r => r.json())
      .then(data => {
        const precip: number = (data.daily?.precipitation_sum as number[])?.[0] ?? 0
        const code: number = (data.daily?.weathercode as number[])?.[0] ?? 0
        if (precip > 2 || code >= 61) {
          const emoji = code >= 95 ? '⛈️' : code >= 71 ? '🌨️' : '🌧️'
          setWeatherWarning(`${emoji} ${precip > 0 ? precip.toFixed(1) + ' mm Regen erwartet' : 'Schlechtes Wetter'} — plan eine Alternative`)
        } else setWeatherWarning(null)
      })
      .catch(() => setWeatherWarning(null))
  }, [form.category, form.date, location?.lat, location?.lng])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.category) { setError('Bitte eine Kategorie wählen.'); return }
    if (!location) { setError('Bitte einen Ort auswählen.'); return }
    if (!form.date) { setError('Bitte Datum angeben.'); return }

    const date_time = new Date(`${form.date}T${form.hour}:${form.minute}:00`).toISOString()
    setSaving(true)
    const { data, error: dbError } = await supabase.from('activities').insert({
      host_id: userId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      vibe: form.vibe || null,
      visibility: form.visibility,
      location_name: location.name,
      address: location.address,
      lat: location.lat,
      lng: location.lng,
      date_time,
      spots_total: parseInt(form.spots_total),
    }).select().single()

    if (dbError) setError('Fehler beim Speichern. Bitte erneut versuchen.')
    else navigate(`/activity/${data.id}`)
    setSaving(false)
  }

  const f = form
  const set = (key: keyof typeof form, val: string) => setForm(p => ({ ...p, [key]: val }))

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="sticky top-0 z-10"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/feed')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">Aktivität erstellen</h1>
          <div className="w-9" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-3">

        {/* 1 — Kategorie */}
        <div className="bg-white rounded-3xl p-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400">
            Was? <span className="text-violet-500">*</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITY_CATEGORIES.map(cat => (
              <button key={cat.label} type="button"
                onClick={() => set('category', cat.label)}
                className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-2xl text-xs font-bold transition-all border"
                style={f.category === cat.label
                  ? { background: '#EDE9FE', borderColor: '#DDD6FE', color: '#7C3AED' }
                  : { background: '#F9F9FB', borderColor: '#E8E8ED', color: '#9CA3AF' }}>
                <span className="text-lg">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2 — Titel + Anzahl */}
        <div className="bg-white rounded-3xl p-4 card-shadow flex flex-col gap-3" style={{ border: '1px solid var(--border)' }}>
          <input
            value={f.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Was machst du? z.B. Padel zu viert 🎾"
            required maxLength={100}
            className="w-full px-4 py-3 rounded-2xl text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 outline-none placeholder:text-gray-400 focus:border-violet-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)] transition-all"
          />
          {/* Spots inline */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase tracking-widest text-gray-400">Plätze gesucht</span>
            <div className="flex items-center gap-3">
              <button type="button"
                onClick={() => set('spots_total', String(Math.max(1, parseInt(f.spots_total) - 1)))}
                className="press w-9 h-9 rounded-xl text-lg font-black text-violet-600 bg-violet-50 border border-violet-100 flex items-center justify-center">−</button>
              <span className="text-xl font-black text-gray-900 w-6 text-center">{f.spots_total}</span>
              <button type="button"
                onClick={() => set('spots_total', String(Math.min(20, parseInt(f.spots_total) + 1)))}
                className="press w-9 h-9 rounded-xl text-lg font-black text-violet-600 bg-violet-50 border border-violet-100 flex items-center justify-center">+</button>
            </div>
          </div>
        </div>

        {/* 3 — Wann */}
        <div className="bg-white rounded-3xl p-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400">
            Wann? <span className="text-violet-500">*</span>
          </p>
          {/* Quick presets */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {TIME_PRESETS.map(preset => {
              const vals = getPresetValues(preset)
              const isActive = f.date === vals.date && f.hour === vals.hour
              return (
                <button key={preset.label} type="button"
                  onClick={() => setForm(p => ({ ...p, ...vals }))}
                  className="py-2 px-1 rounded-xl text-xs font-bold border transition-all text-center leading-tight"
                  style={isActive
                    ? { background: '#EDE9FE', borderColor: '#DDD6FE', color: '#7C3AED' }
                    : { background: '#F9F9FB', borderColor: '#E8E8ED', color: '#6B7280' }}>
                  {preset.label}
                </button>
              )
            })}
          </div>
          {/* Date + time row */}
          <div className="flex gap-2">
            <input type="date" value={f.date} min={today} required
              onChange={e => set('date', e.target.value)}
              className="flex-1 px-3 py-2.5 rounded-2xl text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 outline-none focus:border-violet-400 focus:bg-white transition-all" />
            <select value={f.hour} onChange={e => set('hour', e.target.value)}
              className="px-3 py-2.5 rounded-2xl text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 outline-none focus:border-violet-400 focus:bg-white">
              {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                <option key={h} value={h}>{h}:00</option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 — Wo */}
        <div className="bg-white rounded-3xl p-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400">Wo?</p>
          <LocationSearch value={location} onChange={setLocation} />
        </div>

        {/* Weather warning */}
        {weatherWarning && (
          <div className="px-4 py-3 rounded-2xl text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200">
            {weatherWarning}
          </div>
        )}

        {/* 5 — Mehr Optionen (accordion) */}
        <button type="button" onClick={() => setShowMore(m => !m)}
          className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold text-gray-500 bg-white border border-gray-200 transition-all hover:bg-gray-50">
          <span>+ Mehr Optionen</span>
          <span className="text-xs text-gray-300">{showMore ? '▲' : '▼'}</span>
        </button>

        {showMore && (
          <div className="bg-white rounded-3xl p-4 card-shadow flex flex-col gap-4" style={{ border: '1px solid var(--border)' }}>

            {/* Beschreibung */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-2 text-gray-400">Beschreibung</p>
              <textarea
                value={f.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Weitere Infos, Treffpunkt, Niveau…"
                rows={3} maxLength={500}
                className="w-full px-4 py-3 rounded-2xl text-sm font-medium text-gray-900 resize-none bg-gray-50 border border-gray-200 outline-none placeholder:text-gray-400 focus:border-violet-400 focus:bg-white transition-all"
              />
            </div>

            {/* Vibe */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-2 text-gray-400">Vibe</p>
              <div className="flex gap-2 flex-wrap">
                {VIBES.map(v => (
                  <button key={v.label} type="button"
                    onClick={() => set('vibe', f.vibe === v.label ? '' : v.label)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all"
                    style={f.vibe === v.label
                      ? { background: v.bg, borderColor: v.border, color: v.color }
                      : { background: '#F9F9FB', borderColor: '#E8E8ED', color: '#9CA3AF' }}>
                    {v.emoji} {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sichtbarkeit — compact icon-row */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-2 text-gray-400">Wer sieht das?</p>
              <div className="flex gap-2">
                {([
                  { value: 'public', emoji: '🌍', label: 'Alle' },
                  { value: 'followers', emoji: '👥', label: 'Follower' },
                  { value: 'friends', emoji: '👫', label: 'Freunde' },
                ] as const).map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => set('visibility', opt.value)}
                    className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl text-xs font-bold border transition-all"
                    style={f.visibility === opt.value
                      ? { background: '#EDE9FE', borderColor: '#DDD6FE', color: '#7C3AED' }
                      : { background: '#F9F9FB', borderColor: '#E8E8ED', color: '#9CA3AF' }}>
                    <span className="text-base">{opt.emoji}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-2xl text-sm text-red-600 font-medium bg-red-50 border border-red-100">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={saving}>
          Aktivität posten ⚡
        </Button>

      </form>
      <BottomNav />
    </div>
  )
}
