import type { BadgeProps } from '@without-code/ui'

const variantClass: Record<string, string> = {
  default: 'bg-light text-charcoal',
  brand:   'bg-brand text-white',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-orange-100 text-orange-700',
  danger:  'bg-red-100 text-red-700',
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClass[variant]}`}
    >
      {label}
    </span>
  )
}
