import type { Config } from 'tailwindcss'
import { colors, borderRadius } from '../../packages/ui/tokens'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink:          colors.ink,
        brand:        colors.red,
        'brand-dim':  colors.redDim,
        ivory:        colors.white,
        charcoal:     colors.charcoal,
        stone:        colors.stone,
        cloud:        colors.cloud,
        light:        colors.light,
      },
      borderRadius: {
        sm:      `${borderRadius.sm}px`,
        DEFAULT: `${borderRadius.md}px`,
        md:      `${borderRadius.md}px`,
        lg:      `${borderRadius.lg}px`,
        xl:      `${borderRadius.xl}px`,
        full:    `${borderRadius.full}px`,
      },
      fontFamily: {
        sans: ['Pretendard'],
      },
    },
  },
  plugins: [],
}
export default config
