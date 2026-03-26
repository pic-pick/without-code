import type { ButtonProps } from '@without-code/ui'

const variantClass: Record<string, string> = {
  primary:   'bg-brand text-white hover:bg-brand-dim active:scale-95',
  secondary: 'bg-light text-ink border border-cloud hover:bg-cloud',
  ghost:     'bg-transparent text-ink hover:bg-light',
  danger:    'bg-red-600 text-white hover:bg-red-700',
}

const sizeClass: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-sm',
  md: 'px-4 py-2.5 text-base rounded-md',
  lg: 'px-6 py-3 text-lg rounded-lg',
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  onPress,
  children,
}: ButtonProps) {
  return (
    <button
      onClick={onPress}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand',
        variantClass[variant],
        sizeClass[size],
        fullWidth ? 'w-full' : '',
        disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {loading ? (
        <span className="mr-2 h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : null}
      {children}
    </button>
  )
}
