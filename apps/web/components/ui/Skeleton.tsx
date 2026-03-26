import type { SkeletonProps } from '@without-code/ui'

export function Skeleton({ width, height = 16, borderRadius, style }: SkeletonProps) {
  return (
    <div
      className="animate-pulse bg-cloud"
      style={{
        width,
        height,
        borderRadius: borderRadius ?? 6,
        ...style,
      }}
    />
  )
}

// 자주 쓰는 조합
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-cloud bg-white p-4 space-y-3">
      <Skeleton height={180} width="100%" borderRadius={8} />
      <Skeleton height={14} width="70%" />
      <Skeleton height={12} width="50%" />
      <div className="flex gap-2">
        <Skeleton height={20} width={56} borderRadius={20} />
        <Skeleton height={20} width={56} borderRadius={20} />
      </div>
    </div>
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={12} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </div>
  )
}
