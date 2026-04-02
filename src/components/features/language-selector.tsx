import { LANGUAGES } from '../../lib/constants'

interface LanguageSelectorProps {
  selected: string[]
  onChange: (selected: string[]) => void
}

export function LanguageSelector({ selected, onChange }: LanguageSelectorProps) {
  function toggle(lang: string) {
    const next = selected.includes(lang)
      ? selected.filter(l => l !== lang)
      : [...selected, lang]
    onChange(next)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {LANGUAGES.map(lang => (
        <button
          key={lang}
          type="button"
          onClick={() => toggle(lang)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all
            ${selected.includes(lang)
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          {lang}
        </button>
      ))}
    </div>
  )
}
