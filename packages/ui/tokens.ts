// 코드없이 디자인 토큰 — Web(Tailwind) + Mobile(NativeWind) 공유
export const colors = {
  // 브랜드 컬러
  ink: '#1C1C1A',       // 메인 텍스트·배경
  red: '#E8483A',       // 포인트·CTA
  redDim: '#C23A2E',    // 호버·눌림 상태
  white: '#F7F7F5',     // 밝은 배경·텍스트

  // 중립 컬러
  charcoal: '#444441',  // 보조 텍스트
  stone: '#888780',     // 플레이스홀더·비활성
  cloud: '#D3D1C7',     // 보더·구분선
  light: '#F2F0EB',     // 카드 배경·입력 배경
} as const

export const typography = {
  fontFamily: {
    sans: 'Pretendard',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const
