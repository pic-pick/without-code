import { TextInput, View, Text } from 'react-native'
import type { InputProps } from '@without-code/ui'

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
  const sizeClass = size === 'sm' ? 'px-3 py-2 text-sm' : size === 'lg' ? 'px-4 py-4 text-lg' : 'px-4 py-3 text-base'

  return (
    <View className="gap-1">
      {label && (
        <Text className="text-sm font-medium text-charcoal">{label}</Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888780"
        editable={!disabled}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        maxLength={maxLength}
        className={[
          'rounded-md border bg-white text-ink font-sans',
          sizeClass,
          error ? 'border-red-500' : 'border-cloud',
          disabled ? 'opacity-50 bg-light' : '',
          multiline ? 'min-h-24' : '',
        ].join(' ')}
        style={{ fontFamily: 'Pretendard-Regular' }}
      />
      {error && <Text className="text-xs text-red-500">{error}</Text>}
    </View>
  )
}
