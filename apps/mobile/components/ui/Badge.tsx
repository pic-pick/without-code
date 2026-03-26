import { View, Text } from 'react-native'
import type { BadgeProps } from '@without-code/ui'

const variantClass: Record<string, { bg: string; text: string }> = {
  default: { bg: 'bg-light',        text: 'text-charcoal' },
  brand:   { bg: 'bg-brand',        text: 'text-white' },
  success: { bg: 'bg-green-100',    text: 'text-green-700' },
  warning: { bg: 'bg-orange-100',   text: 'text-orange-700' },
  danger:  { bg: 'bg-red-100',      text: 'text-red-700' },
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const v = variantClass[variant]
  return (
    <View className={`rounded-full px-2.5 py-0.5 self-start ${v.bg}`}>
      <Text className={`text-xs font-medium ${v.text}`}>{label}</Text>
    </View>
  )
}
