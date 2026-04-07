import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ACTIVITY_CATEGORIES, VIBES } from '../lib/constants'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
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

export function CreatePage({ userId }: CreatePageProps) {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    vibe: '',
    date: '',
    hour: '12',
    minute: '00',
    spots_total: '3',
    visibility: 'public' as 'public' | 'followers' | 'friends',
  })
  const [location, setLocation] = useState<SelectedLocation | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [weatherWarning, setWeatherWarning] = useState<string | null>(null)

  const today = new Date().toISOString().split('T')[0]

  // Weather check for outdoor categories
  const OUTDOOR_CATS = ['Sport', 'Outdoor', 'Reisen']
  useEffect(() => {
    if (!OUTDOOR_CATS.includes(form.category) || !form.date || !location) {
      setWeatherWarning(null)
      return
    }
    const diffDays = (new Date(form.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    if (diffDays < 0 || diffDays > 14) { setWeatherWarning(null); return }

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lng}&daily=precipitation_sum,weathercode&timezone=auto&start_date=${form.date}&end_date=${form.date}`
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const precip: number = (data.daily?.precipitation_sum as number[])?.[0] ?? 0
        const code: number = (data.daily?.weathercode as number[])?.[0] ?? 0
        if (precip > 2 || code >= 61) {
          const emoji = code >= 95 ? '⛈️' : code >= 71 ? '🌨️' : '🌧️'
          setWeatherWarning(`${emoji} Wetterwarnung: ${precip > 0 ? precip.toFixed(1) + ' mm Regen erwartet' : 'Schlechtes Wetter vorhergesagt'} — plane ggf. eine Alternative`)
        } else {
          setWeatherWarning(null)
        }
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
    const { data, error: dbError } = await supabase
      .from('activities')
      .insert({
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
      })
      .select()
      .single()

    if (dbError) {
      setError('Fehler beim Speichern. Bitte erneut versuchen.')
    } else {
      navigate(`/activity/${data.id}`)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="sticky top-0 z-10"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/feed')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest">Aktivität erstellen</h1>
          <div className="w-9" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-4">

        {/* Kategorie */}
        <div className="bg-white rounded-3xl p-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400">
            Kategorie <span className="text-violet-500">*</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ACTIVITY_CATEGORIES.map(cat => (
              <button
                key={cat.label}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat.label }))}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-200 border"
                style={form.category === cat.label
                  ? { background: '#EDE9FE', borderColor: '#DDD6FE', color: '#7C3AED' }
                  : { background: '#F9F9FB', borderColor: '#E8E8ED', color: '#9CA3AF' }
                }
              >
                <span className="text-xl">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vibe */}
        <div className="bg-white rounded-3xl p-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400">Vibe (optional)</p>
          <div className="flex gap-2 flex-wrap">
            {VIBES.map(v => (
              <button
                key={v.label}
                type="button"
                onClick={() => setForm(f => ({ ...f, vibe: f.vibe === v.label ? '' : v.label }))}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition-all duration-200"
                style={form.vibe === v.label
                  ? { background: v.bg, borderColor: v.border, color: v.color }
                  : { background: '#F9F9FB', borderColor: '#E8E8ED', color: '#9CA3AF' }
                }
              >
                <span>{v.emoji}</span>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sichtbarkeit */}
        <div className="bg-white rounded-3xl p-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400">Wer kann mitmachen?</p>
          <div className="flex flex-col gap-2">
            {([
              { value: 'public', emoji: '🌍', label: 'Alle', desc: 'Jeder sieht diese Aktivität' },
              { value: 'followers', emoji: '👥', label: 'Follower', desc: 'Nur Leute die dir folgen' },
              { value: 'friends', emoji: '👫', label: 'Freunde', desc: 'Nur gegenseitige Follower' },
            ] as const).map(opt => (
              <button key={opt.value} type="button"
                onClick={() => setForm(f => ({ ...f, visibility: opt.value }))}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-left border transition-all"
                style={form.visibility === opt.value
                  ? { background: '#EDE9FE', borderColor: '#DDD6FE', color: '#7C3AED' }
                  : { background: '#F9F9FB', borderColor: '#E8E8ED', color: '#6B7280' }}>
                <span className="text-xl">{opt.emoji}</span>
                <div>
                  <div className="text-sm font-bold">{opt.label}</div>
                  <div className="text-xs opacity-70">{opt.desc}</div>
                </div>
                {form.visibility === opt.value && (
                  <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-black"
                    style={{ background: '#7C3AED' }}>✓</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-3xl p-4 flex flex-col gap-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Details</p>
          <Input
            label="Was machst du?"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder='z.B. "Brauche 4. Padel-Spieler heute 18 Uhr"'
            required
            maxLength={100}
          />
          <Textarea
            label="Beschreibung (optional)"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Weitere Infos, Treffpunkt, Niveau..."
            rows={3}
            maxLength={500}
          />
        </div>

        {/* Ort */}
        <div className="bg-white rounded-3xl p-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400">Ort</p>
          <LocationSearch value={location} onChange={setLocation} />
        </div>

        {/* Weather Warning */}
        {weatherWarning && (
          <div className="px-4 py-3 rounded-2xl text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 leading-snug">
            {weatherWarning}
          </div>
        )}

        {/* Datum & Uhrzeit */}
        <div className="bg-white rounded-3xl p-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest mb-3 text-gray-400">
            Wann? <span className="text-violet-500">*</span>
          </p>

          {/* Quick time buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { label: '⚡ In 1 Stunde', hours: 1 },
              { label: '🕐 In 2 Stunden', hours: 2 },
              { label: '🌆 Heute Abend', hours: null, time: '19:00' },
              { label: '☀️ Morgen', hours: null, tomorrow: true },
            ].map(preset => {
              const getPresetValues = () => {
                const now = new Date()
                if (preset.hours !== undefined && preset.hours !== null) {
                  const t = new Date(now.getTime() + preset.hours * 3600000)
                  return {
                    date: t.toISOString().split('T')[0],
                    hour: String(t.getHours()).padStart(2, '0'),
                    minute: t.getMinutes() < 30 ? '00' : '30',
                  }
                }
                if (preset.tomorrow) {
                  const t = new Date(now)
                  t.setDate(t.getDate() + 1)
                  return { date: t.toISOString().split('T')[0], hour: '12', minute: '00' }
                }
                return { date: now.toISOString().split('T')[0], hour: '19', minute: '00' }
              }
              const vals = getPresetValues()
              const isActive = form.date === vals.date && form.hour === vals.hour
              return (
                <button key={preset.label} type="button"
                  onClick={() => setForm(f => ({ ...f, ...vals }))}
                  className="py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all text-left"
                  style={isActive
                    ? { background: '#EDE9FE', borderColor: '#DDD6FE', color: '#7C3AED' }
                    : { background: '#F9F9FB', borderColor: '#E8E8ED', color: '#6B7280' }}>
                  {preset.label}
                </button>
              )
            })}
          </div>

          {/* Custom date/time */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 sm:col-span-1">
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                min={today}
                required
                className="w-full px-3 py-2.5 rounded-2xl text-sm font-medium text-gray-900 outline-none transition-all bg-gray-50 border border-gray-200 focus:border-violet-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]"
              />
            </div>
            <select
              value={form.hour}
              onChange={e => setForm(f => ({ ...f, hour: e.target.value }))}
              className="px-3 py-2.5 rounded-2xl text-sm font-medium text-gray-900 outline-none transition-all bg-gray-50 border border-gray-200 focus:border-violet-400 focus:bg-white"
            >
              {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                <option key={h} value={h}>{h} Uhr</option>
              ))}
            </select>
            <select
              value={form.minute}
              onChange={e => setForm(f => ({ ...f, minute: e.target.value }))}
              className="px-3 py-2.5 rounded-2xl text-sm font-medium text-gray-900 outline-none transition-all bg-gray-50 border border-gray-200 focus:border-violet-400 focus:bg-white"
            >
              {['00', '15', '30', '45'].map(m => (
                <option key={m} value={m}>:{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Spots */}
        <div className="bg-white rounded-3xl p-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest mb-4 text-gray-400">
            Wie viele Leute suchst du? <span className="text-violet-500">*</span>
          </p>
          <div className="flex items-center gap-5 justify-center">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, spots_total: String(Math.max(3, parseInt(f.spots_total) - 1)) }))}
              className="press w-12 h-12 rounded-2xl text-xl font-black text-violet-600 bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-all"
            >
              −
            </button>
            <div className="flex-1 text-center">
              <div className="text-4xl font-black text-gray-900">{form.spots_total}</div>
              <div className="text-xs font-semibold text-gray-400 mt-0.5">
                {parseInt(form.spots_total) === 1 ? 'Person' : 'Personen'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, spots_total: String(Math.min(20, parseInt(f.spots_total) + 1)) }))}
              className="press w-12 h-12 rounded-2xl text-xl font-black text-violet-600 bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-all"
            >
              +
            </button>
          </div>
        </div>

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
