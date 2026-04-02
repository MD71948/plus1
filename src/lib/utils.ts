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

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'gerade eben'
  if (m < 60) return `vor ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `vor ${h}h`
  return `vor ${Math.floor(h / 24)}d`
}
