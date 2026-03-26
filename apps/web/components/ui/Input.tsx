import type { InputProps } from '@without-code/ui'

const sizeClass: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-4 py-3 text-lg',
}

export function Input({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  disabled = false,
  secureTextEntry = false,
  size = 'md',
  multiline = false,
  maxLength,
}: InputProps) {
  const base = [
    'w-full rounded-md border bg-white font-sans text-ink placeholder:text-stone outline-none',
    'transition-colors focus:border-brand focus:ring-1 focus:ring-brand',
    sizeClass[size],
    error ? 'border-red-500' : 'border-cloud',
    disabled ? 'opacity-50 cursor-not-allowed bg-light' : '',
  ].join(' ')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-charcoal">{label}</label>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          rows={4}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type={secureTextEntry ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={maxLength}
          className={base}
        />
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
