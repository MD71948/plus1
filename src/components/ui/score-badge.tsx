interface ScoreBadgeProps {
  score: number
  count: number
  size?: 'sm' | 'md'
}

export function ScoreBadge({ score, count, size = 'sm' }: ScoreBadgeProps) {
  if (count === 0) {
    return (
      <span className={`font-bold rounded-full border
        ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}
        bg-gray-100 text-gray-400 border-gray-200`}>
        Neu
      </span>
    )
  }

  const color = score >= 90
    ? { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', dot: '#22C55E' }
    : score >= 70
    ? { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', dot: '#F59E0B' }
    : { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', dot: '#EF4444' }

  return (
    <span className={`inline-flex items-center gap-1 font-black rounded-full border
      ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}`}
      style={{ background: color.bg, color: color.text, borderColor: color.border }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color.dot }} />
      {score}%
    </span>
  )
}
