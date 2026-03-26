import { useEffect } from 'react'
import { View, Text } from 'react-native'
import type { ToastProps } from '@without-code/ui'

const typeClass: Record<string, string> = {
  success: 'bg-green-600',
  error:   'bg-red-600',
  info:    'bg-ink',
  warning: 'bg-orange-500',
}

const typeIcon: Record<string, string> = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
}

export function Toast({ message, type = 'info', visible, onHide }: ToastProps) {
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => onHide?.(), 3000)
    return () => clearTimeout(t)
  }, [visible, onHide])

  if (!visible) return null

  return (
    <View
      className={`absolute bottom-8 self-center z-50 flex-row items-center gap-2 rounded-lg px-4 py-3 shadow-lg ${typeClass[type]}`}
      style={{ alignSelf: 'center' }}
    >
      <Text className="text-white font-medium">{typeIcon[type]} {message}</Text>
    </View>
  )
}
