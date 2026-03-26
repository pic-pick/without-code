import { View } from 'react-native'
import type { SkeletonProps } from '@without-code/ui'

export function Skeleton({ width, height = 16, borderRadius = 6, style }: SkeletonProps) {
  return (
    <View
      className="bg-cloud animate-pulse"
      style={[{ width, height, borderRadius }, style as object]}
    />
  )
}

export function SkeletonCard() {
  return (
    <View className="rounded-lg border border-cloud bg-white p-4 gap-3">
      <Skeleton height={180} width="100%" borderRadius={8} />
      <Skeleton height={14} width="70%" />
      <Skeleton height={12} width="50%" />
      <View className="flex-row gap-2">
        <Skeleton height={20} width={56} borderRadius={20} />
        <Skeleton height={20} width={56} borderRadius={20} />
      </View>
    </View>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <View className="gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </View>
  )
}
