import { useState } from 'react'
import { INTEREST_TAGS } from '../../lib/constants'

interface InterestTagsSelectorProps {
  selected: string[]
  customTags: string[]
  onChange: (selected: string[], custom: string[]) => void
}

export function InterestTagsSelector({ selected, customTags, onChange }: InterestTagsSelectorProps) {
  const [customInput, setCustomInput] = useState('')

  function toggleTag(tag: string) {
    const next = selected.includes(tag)
      ? selected.filter(t => t !== tag)
      : [...selected, tag]
    onChange(next, customTags)
  }

  function addCustomTag() {
    const tag = customInput.trim()
    if (!tag || customTags.includes(tag) || selected.includes(tag)) {
      setCustomInput('')
      return
    }
    onChange(selected, [...customTags, tag])
    setCustomInput('')
  }

  function removeCustomTag(tag: string) {
    onChange(selected, customTags.filter(t => t !== tag))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {INTEREST_TAGS.map(tag => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all
              ${selected.includes(tag)
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {tag}
          </button>
        ))}
        {customTags.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
            {tag}
            <button type="button" onClick={() => removeCustomTag(tag)} className="ml-0.5 hover:text-orange-900">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      {/* Custom tag input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
          placeholder="Eigenes Interesse hinzufügen..."
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          maxLength={30}
        />
        <button
          type="button"
          onClick={addCustomTag}
          disabled={!customInput.trim()}
          className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
        >
          + Hinzufügen
        </button>
      </div>
    </div>
  )
}
