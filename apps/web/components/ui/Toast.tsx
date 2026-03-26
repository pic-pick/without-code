'use client'

import { useEffect } from 'react'
import type { ToastProps } from '@without-code/ui'

const typeClass: Record<string, string> = {
  success: 'bg-green-600 text-white',
  error:   'bg-red-600 text-white',
  info:    'bg-ink text-white',
  warning: 'bg-orange-500 text-white',
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
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg text-sm font-medium transition-all ${typeClass[type]}`}
    >
      <span>{typeIcon[type]}</span>
      <span>{message}</span>
    </div>
  )
}
