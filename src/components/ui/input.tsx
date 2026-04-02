import { type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {label}
          {props.required && <span className="text-violet-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={`w-full px-4 py-3 rounded-2xl text-sm font-medium text-gray-900
          bg-gray-50 border border-gray-200
          placeholder:text-gray-400 outline-none transition-all duration-200
          focus:bg-white focus:border-violet-400 focus:shadow-[0_0_0_3px_rgba(124,58,237,0.1)]
          disabled:opacity-40
          ${error ? 'border-red-400 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]' : ''}
          ${className}`}
        {...props}
      />
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
