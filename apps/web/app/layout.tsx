import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'

export const metadata: Metadata = {
  title: '코드없이 — 바이브코딩 쇼케이스',
  description: 'AI로 만든 것을 공유하고, 프롬프트를 나누고, 함께 성장하는 커뮤니티',
  openGraph: {
    title: '코드없이',
    description: 'AI로 만든 것을 공유하고, 프롬프트를 나누고, 함께 성장하는 커뮤니티',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
