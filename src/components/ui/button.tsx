import { type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed select-none press'

  const variants = {
    primary: `
      bg-gradient-to-r from-violet-600 to-violet-500 text-white
      hover:from-violet-700 hover:to-violet-600
      shadow-[0_4px_14px_rgba(124,58,237,0.35)]
      hover:shadow-[0_6px_20px_rgba(124,58,237,0.45)]
    `,
    secondary: `
      bg-white text-gray-700 border border-gray-200
      hover:bg-gray-50 hover:border-gray-300
      shadow-sm
    `,
    ghost: 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
    danger: `
      bg-gradient-to-r from-red-600 to-red-500 text-white
      hover:from-red-700 hover:to-red-600
      shadow-[0_4px_14px_rgba(239,68,68,0.3)]
    `,
  }

  const sizes = {
    sm: 'text-xs px-3 py-2',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3.5',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
