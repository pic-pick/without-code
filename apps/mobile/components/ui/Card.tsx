import { Pressable, View } from 'react-native'
import type { CardProps } from '@without-code/ui'

export function Card({ children, onPress, padding = true }: CardProps) {
  const base = `bg-white rounded-lg border border-cloud ${padding ? 'p-4' : ''}`

  if (onPress) {
    return (
      <Pressable onPress={onPress} className={`${base} active:opacity-80`}>
        {children}
      </Pressable>
    )
  }
  return <View className={base}>{children}</View>
}
