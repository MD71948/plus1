import { useEffect, useState } from 'react'

interface WeatherData {
  temp: number
  code: number
  precipProb: number
}

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 77) return '🌨️'
  if (code <= 82) return '🌦️'
  if (code <= 86) return '🌨️'
  return '⛈️'
}

function weatherLabel(code: number): string {
  if (code === 0) return 'Sonnig'
  if (code <= 2) return 'Leicht bewölkt'
  if (code === 3) return 'Bewölkt'
  if (code <= 48) return 'Neblig'
  if (code <= 67) return 'Regen'
  if (code <= 77) return 'Schnee'
  if (code <= 82) return 'Schauer'
  if (code <= 86) return 'Schneeschauer'
  return 'Gewitter'
}

interface WeatherBadgeProps {
  lat: number
  lng: number
  dateTime: string
}

export function WeatherBadge({ lat, lng, dateTime }: WeatherBadgeProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)

  useEffect(() => {
    const actDate = new Date(dateTime)
    const diffDays = (actDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    // Only show forecast for future activities within 14 days
    if (diffDays < 0 || diffDays > 14) return

    const dateStr = actDate.toISOString().split('T')[0]
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,weathercode,precipitation_probability&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`

    fetch(url)
      .then(r => r.json())
      .then(data => {
        const hour = actDate.getHours()
        setWeather({
          temp: Math.round((data.hourly.temperature_2m as number[])[hour]),
          code: (data.hourly.weathercode as number[])[hour],
          precipProb: (data.hourly.precipitation_probability as number[])[hour] ?? 0,
        })
      })
      .catch(() => {})
  }, [lat, lng, dateTime])

  if (!weather) return null

  const isWet = weather.precipProb > 40
  const bg = isWet ? '#DBEAFE' : '#FEFCE8'
  const border = isWet ? '#BFDBFE' : '#FEF08A'
  const color = isWet ? '#1D4ED8' : '#92400E'

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
      style={{ background: bg, borderColor: border }}>
      <span className="text-2xl">{weatherEmoji(weather.code)}</span>
      <div>
        <div className="text-sm font-black" style={{ color }}>
          {weatherLabel(weather.code)} · {weather.temp}°C
        </div>
        {weather.precipProb > 20 && (
          <div className="text-xs font-semibold mt-0.5" style={{ color: color + 'CC' }}>
            💧 {weather.precipProb}% Regenwahrscheinlichkeit
          </div>
        )}
      </div>
    </div>
  )
}
