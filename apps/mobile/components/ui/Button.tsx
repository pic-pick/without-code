import { Pressable, Text, ActivityIndicator, View } from 'react-native'
import type { ButtonProps } from '@without-code/ui'

const variantClass: Record<string, string> = {
  primary:   'bg-brand active:bg-brand-dim',
  secondary: 'bg-light border border-cloud',
  ghost:     'bg-transparent',
  danger:    'bg-red-600',
}

const textClass: Record<string, string> = {
  primary:   'text-white',
  secondary: 'text-ink',
  ghost:     'text-ink',
  danger:    'text-white',
}

const sizeClass: Record<string, string> = {
  sm: 'px-3 py-2 rounded-sm',
  md: 'px-4 py-3 rounded-md',
  lg: 'px-6 py-4 rounded-lg',
}

const textSizeClass: Record<string, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
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
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={[
        'flex-row items-center justify-center',
        variantClass[variant],
        sizeClass[size],
        fullWidth ? 'w-full' : 'self-start',
        disabled || loading ? 'opacity-50' : '',
      ].join(' ')}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#fff' : '#1C1C1A'}
          style={{ marginRight: 8 }}
        />
      )}
      <Text className={`font-semibold ${textClass[variant]} ${textSizeClass[size]}`}>
        {children}
      </Text>
    </Pressable>
  )
}
