import type { Config } from 'tailwindcss'
import { colors, borderRadius } from '../../packages/ui/tokens'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx}',
  ],
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
        sans: ['Pretendard', 'Apple SD Gothic Neo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
