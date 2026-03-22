import { colors, typography, spacing, borderRadius } from './tokens'

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
} as const

export type Theme = typeof theme
