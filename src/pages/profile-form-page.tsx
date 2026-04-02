import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { type UserProfile } from '../types'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'
import { AvatarUpload } from '../components/features/avatar-upload'
import { InterestTagsSelector } from '../components/features/interest-tags-selector'
import { LanguageSelector } from '../components/features/language-selector'

interface ProfileFormPageProps {
  userId: string
  existingProfile?: UserProfile | null
  onSaved?: (profile: UserProfile) => void
}

export function ProfileFormPage({ userId, existingProfile, onSaved }: ProfileFormPageProps) {
  const navigate = useNavigate()
  const isSetup = !existingProfile

  const [form, setForm] = useState({
    name: '',
    bio: '',
    age: '',
    district: '',
    postal_code: '',
    city: '',
    avatar_url: null as string | null,
    interests: [] as string[],
    custom_interests: [] as string[],
    languages: [] as string[],
    lat: null as number | null,
    lng: null as number | null,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)

  useEffect(() => {
    if (existingProfile) {
      setForm({
        name: existingProfile.name,
        bio: existingProfile.bio ?? '',
        age: existingProfile.age?.toString() ?? '',
        district: existingProfile.district ?? '',
        postal_code: existingProfile.postal_code ?? '',
        city: existingProfile.city ?? '',
        avatar_url: existingProfile.avatar_url,
        interests: existingProfile.interests ?? [],
        custom_interests: existingProfile.custom_interests ?? [],
        languages: existingProfile.languages ?? [],
        lat: existingProfile.lat,
        lng: existingProfile.lng,
      })
    }
  }, [existingProfile])

  function detectLocation() {
    if (!navigator.geolocation) return
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(f => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }))
        setLocationLoading(false)
      },
      () => setLocationLoading(false)
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Name ist erforderlich.')
      return
    }

    setSaving(true)

    const payload = {
      user_id: userId,
      name: form.name.trim(),
      bio: form.bio.trim() || null,
      age: form.age ? parseInt(form.age) : null,
      district: form.district.trim() || null,
      postal_code: form.postal_code.trim() || null,
      city: form.city.trim() || null,
      avatar_url: form.avatar_url,
      interests: form.interests,
      custom_interests: form.custom_interests,
      languages: form.languages,
      lat: form.lat,
      lng: form.lng,
    }

    const { error } = isSetup
      ? await supabase.from('user_profiles').insert(payload)
      : await supabase.from('user_profiles').update(payload).eq('user_id', userId)

    if (error) {
      setError('Speichern fehlgeschlagen. Bitte erneut versuchen.')
    } else {
      const { data } = await supabase.from('user_profiles').select('*').eq('user_id', userId).single()
      if (data && onSaved) onSaved(data)
      navigate('/profile')
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: 'var(--bg)' }}>

      {/* Header */}
      <div className="sticky top-0 z-10"
        style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
          {!isSetup && (
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-sm font-black text-gray-900 uppercase tracking-widest mx-auto">
            {isSetup ? 'Profil einrichten' : 'Profil bearbeiten'}
          </h1>
          {!isSetup && <div className="w-9" />}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-4">

        {isSetup && (
          <p className="text-center text-sm font-medium text-gray-500 -mt-1">
            Fast geschafft! Richte dein Profil ein, damit andere wissen, wer du bist.
          </p>
        )}

        {/* Avatar */}
        <div className="flex justify-center py-2">
          <AvatarUpload
            userId={userId}
            currentUrl={form.avatar_url}
            onUpload={url => setForm(f => ({ ...f, avatar_url: url }))}
          />
        </div>

        {/* Grundinfo */}
        <div className="bg-white rounded-3xl p-4 flex flex-col gap-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Über dich</p>
          <Input
            label="Dein Name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Wie sollen andere dich nennen?"
            required
            maxLength={50}
          />
          <Textarea
            label="Bio"
            value={form.bio}
            onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
            placeholder="Erzähl kurz was über dich..."
            rows={3}
            maxLength={200}
            hint={`${form.bio.length}/200`}
          />
          <Input
            label="Alter (optional)"
            type="number"
            value={form.age}
            onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
            placeholder="z.B. 28"
            min={16}
            max={99}
          />
        </div>

        {/* Standort */}
        <div className="bg-white rounded-3xl p-4 flex flex-col gap-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Standort</p>
          <Input
            label="Stadt"
            value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
            placeholder="z.B. Berlin"
            maxLength={50}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Stadtteil"
              value={form.district}
              onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
              placeholder="z.B. Prenzlauer Berg"
              maxLength={50}
            />
            <Input
              label="PLZ"
              value={form.postal_code}
              onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))}
              placeholder="z.B. 10405"
              maxLength={10}
            />
          </div>

          <button
            type="button"
            onClick={detectLocation}
            disabled={locationLoading}
            className="flex items-center gap-2 text-sm font-bold transition-colors disabled:opacity-50"
            style={{ color: form.lat ? '#7C3AED' : '#9CA3AF' }}
          >
            <svg className={`w-4 h-4 ${locationLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {locationLoading
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              }
            </svg>
            {form.lat ? '✓ Standort gespeichert' : 'Aktuellen Standort verwenden'}
          </button>
          <p className="text-xs text-gray-400 -mt-2">
            Wird für den Nähe-Filter im Feed verwendet — nicht öffentlich sichtbar.
          </p>
        </div>

        {/* Interessen */}
        <div className="bg-white rounded-3xl p-4 flex flex-col gap-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Interessen</p>
          <InterestTagsSelector
            selected={form.interests}
            customTags={form.custom_interests}
            onChange={(interests, custom_interests) =>
              setForm(f => ({ ...f, interests, custom_interests }))
            }
          />
        </div>

        {/* Sprachen */}
        <div className="bg-white rounded-3xl p-4 flex flex-col gap-4 card-shadow" style={{ border: '1px solid var(--border)' }}>
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">Sprachen</p>
          <LanguageSelector
            selected={form.languages}
            onChange={languages => setForm(f => ({ ...f, languages }))}
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-2xl text-sm text-red-600 font-medium bg-red-50 border border-red-100">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={saving}>
          {isSetup ? 'Profil erstellen' : 'Änderungen speichern'}
        </Button>

        {!isSetup && (
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="text-center text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
          >
            Abbrechen
          </button>
        )}
      </form>
    </div>
  )
}
