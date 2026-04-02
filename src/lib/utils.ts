export function getCategoryClass(category: string): string {
  const map: Record<string, string> = {
    'Sport': 'cat-sport',
    'Outdoor': 'cat-outdoor',
    'Essen & Trinken': 'cat-food',
    'Kultur & Kunst': 'cat-culture',
    'Musik': 'cat-music',
    'Gaming': 'cat-gaming',
    'Reisen': 'cat-travel',
    'Lernen': 'cat-learn',
    'Sonstiges': 'cat-other',
  }
  return map[category] ?? 'cat-other'
}

export function getUrgencyLabel(dateTime: string): string | null {
  const diff = new Date(dateTime).getTime() - Date.now()
  if (diff < 0) return 'Läuft gerade'
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (minutes < 60) return `Startet in ${minutes}min!`
  if (hours < 24) return `Startet in ${hours}h!`
  return null
}

// Haversine formula — distance in km between two GPS coordinates
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1).replace('.', ',')} km`
}

export function isWithinHours(dateTime: string, hours: number): boolean {
  const diff = new Date(dateTime).getTime() - Date.now()
  return diff > 0 && diff <= hours * 3600000
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'gerade eben'
  if (m < 60) return `vor ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `vor ${h}h`
  return `vor ${Math.floor(h / 24)}d`
}
