// 공통 UI 컴포넌트 Props 타입 정의
// Web(apps/web/components/ui/)과 Mobile(apps/mobile/components/ui/)에서 동일 인터페이스 사용

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  onPress?: () => void
  children: React.ReactNode
}

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  label?: string
  error?: string
  disabled?: boolean
  secureTextEntry?: boolean
  size?: InputSize
  multiline?: boolean
  maxLength?: number
}

export interface CardProps {
  children: React.ReactNode
  onPress?: () => void
  padding?: boolean
}

export type BadgeVariant = 'default' | 'brand' | 'success' | 'warning' | 'danger'

export interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastProps {
  message: string
  type?: ToastType
  visible: boolean
  onHide?: () => void
}

export interface SkeletonProps {
  width?: number | string
  height?: number | string
  borderRadius?: number
  style?: React.CSSProperties | object
}
