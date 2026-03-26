import type { CardProps } from '@without-code/ui'

export function Card({ children, onPress, padding = true }: CardProps) {
  const base = `bg-white rounded-lg border border-cloud shadow-sm transition-shadow ${
    onPress ? 'cursor-pointer hover:shadow-md active:scale-[0.99]' : ''
  } ${padding ? 'p-4' : ''}`

  if (onPress) {
    return (
      <button onClick={onPress} className={`w-full text-left ${base}`}>
        {children}
      </button>
    )
  }
  return <div className={base}>{children}</div>
}
