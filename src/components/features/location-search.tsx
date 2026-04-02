import { useState, useEffect, useRef } from 'react'

interface LocationResult {
  display_name: string
  lat: string
  lon: string
}

interface SelectedLocation {
  name: string
  address: string
  lat: number
  lng: number
}

interface LocationSearchProps {
  value: SelectedLocation | null
  onChange: (location: SelectedLocation | null) => void
}

export function LocationSearch({ value, onChange }: LocationSearchProps) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [results, setResults] = useState<LocationResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setQuery(q)
    onChange(null) // clear selection when typing

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (q.length < 3) { setResults([]); setOpen(false); return }

    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'de' } }
        )
        const data: LocationResult[] = await res.json()
        setResults(data)
        setOpen(true)
      } catch {
        setResults([])
      }
      setLoading(false)
    }, 400)
  }

  function handleSelect(result: LocationResult) {
    // Show just the first part as name, full string as address
    const parts = result.display_name.split(', ')
    const name = parts.slice(0, 2).join(', ')
    onChange({
      name,
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    })
    setQuery(name)
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        Ort <span className="text-orange-500">*</span>
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="z.B. Tempelhofer Feld, Berlin"
          className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm outline-none transition-all
            focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {loading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Dropdown results */}
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
          {results.map((r, i) => {
            const parts = r.display_name.split(', ')
            const main = parts.slice(0, 2).join(', ')
            const sub = parts.slice(2, 4).join(', ')
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-50 last:border-0"
              >
                <div className="text-sm font-medium text-gray-900">{main}</div>
                {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
              </button>
            )
          })}
        </div>
      )}

      {/* Confirmed selection */}
      {value && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Ort gespeichert
        </p>
      )}
    </div>
  )
}
