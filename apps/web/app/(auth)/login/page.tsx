'use client'

import { useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser'

const PROVIDERS = [
  {
    id: 'kakao' as const,
    label: '카카오로 계속하기',
    className: 'bg-[#FEE500] border-[#FEE500] text-[#1A1A1A] hover:bg-[#f0d900]',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 2.5C5.86 2.5 2.5 5.19 2.5 8.5c0 2.08 1.24 3.9 3.12 5.02L4.75 18l3.56-2.35c.55.08 1.12.12 1.69.12 4.14 0 7.5-2.69 7.5-6S14.14 2.5 10 2.5z"
          fill="#1A1A1A"
        />
      </svg>
    ),
  },
  {
    id: 'google' as const,
    label: 'Google로 계속하기',
    className:
      'bg-white border-cloud text-ink hover:bg-light active:bg-light',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M18.4 10.2c0-.66-.06-1.3-.17-1.9H10v3.6h4.7c-.2 1.04-.8 1.92-1.7 2.52v2.08h2.74C17.5 14.9 18.4 12.7 18.4 10.2z"
          fill="#4285F4"
        />
        <path
          d="M10 18c2.3 0 4.22-.76 5.63-2.06l-2.74-2.12c-.76.5-1.73.8-2.9.8-2.22 0-4.1-1.5-4.77-3.52H2.4v2.2C3.8 16.18 6.7 18 10 18z"
          fill="#34A853"
        />
        <path
          d="M5.23 11.1C5.06 10.6 4.97 10.06 4.97 9.5s.09-1.1.26-1.6V5.7H2.4A8 8 0 0 0 2 9.5c0 1.3.3 2.52.4 3.8l2.83-2.2z"
          fill="#FBBC05"
        />
        <path
          d="M10 4.5c1.25 0 2.37.43 3.25 1.28l2.44-2.44C14.22 2 12.28 1.5 10 1.5 6.7 1.5 3.8 3.32 2.4 6L5.23 8.2C5.9 6.18 7.78 4.5 10 4.5z"
          fill="#EA4335"
        />
      </svg>
    ),
  },
  {
    id: 'github' as const,
    label: 'GitHub으로 계속하기',
    className:
      'bg-white border-cloud text-ink hover:bg-light active:bg-light',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 1C5.03 1 1 5.03 1 10c0 3.98 2.58 7.36 6.16 8.56.45.08.61-.2.61-.43v-1.5c-2.5.54-3.03-1.2-3.03-1.2-.41-1.04-.99-1.32-.99-1.32-.81-.55.06-.54.06-.54.9.06 1.37.92 1.37.92.8 1.36 2.09.97 2.6.74.08-.58.31-.97.57-1.2-1.99-.22-4.08-1-4.08-4.43 0-.98.35-1.78.92-2.41-.09-.23-.4-1.14.09-2.37 0 0 .75-.24 2.45.91a8.55 8.55 0 0 1 4.46 0c1.7-1.15 2.45-.91 2.45-.91.49 1.23.18 2.14.09 2.37.57.63.92 1.43.92 2.41 0 3.44-2.1 4.2-4.1 4.42.32.28.61.83.61 1.67v2.48c0 .24.16.52.62.43A9 9 0 0 0 19 10c0-4.97-4.03-9-9-9z"
          fill="#1C1C1A"
        />
      </svg>
    ),
  },
]

export default function LoginPage() {
  const supabase = getBrowserClient()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleOAuth(provider: 'kakao' | 'google' | 'github') {
    setLoading(provider)
    setError(null)
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        scopes: provider === 'github' ? 'read:user user:email' : undefined,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(null)
    }
    // 성공 시 리다이렉트되므로 setLoading(null) 불필요
  }

  return (
    <main className="flex min-h-svh flex-col">
      {/* 네비 */}
      <nav className="flex items-center border-b border-cloud bg-ivory px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[7px] bg-ink">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path
                d="M5 1L1 6l4 5"
                stroke="#E8483A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11 1l4 5-4 5"
                stroke="#E8483A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-[15px] font-extrabold tracking-tight">
            코드<span className="text-brand">없이</span>
          </span>
        </div>
      </nav>

      {/* 본문 */}
      <div className="flex flex-1 items-center justify-center px-5 py-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-7">
            <h1 className="mb-1.5 text-[22px] font-extrabold leading-snug tracking-tight md:text-[26px]">
              코드없이에
              <br />
              오신 걸 환영해요
            </h1>
            <p className="text-sm leading-relaxed text-stone">
              AI로 만든 것을 공유하고,
              <br />
              프롬프트를 나누고, 함께 성장하세요
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-[8px] border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-brand">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {PROVIDERS.map(({ id, label, className, icon }) => (
              <button
                key={id}
                onClick={() => handleOAuth(id)}
                disabled={loading !== null}
                className={`flex w-full items-center gap-3 rounded-[10px] border-[1.5px] px-[18px] py-3.5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
              >
                <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center">
                  {loading === id ? (
                    <svg
                      className="animate-spin"
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                    >
                      <circle
                        cx="9"
                        cy="9"
                        r="7"
                        stroke="currentColor"
                        strokeOpacity=".3"
                        strokeWidth="2"
                      />
                      <path
                        d="M9 2a7 7 0 0 1 7 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  ) : (
                    icon
                  )}
                </span>
                {label}
              </button>
            ))}
          </div>

          <p className="mt-5 text-center text-xs leading-7 text-stone">
            계속 진행하면{' '}
            <a href="/terms" className="text-charcoal underline underline-offset-2">
              이용약관
            </a>
            과{' '}
            <a href="/privacy" className="text-charcoal underline underline-offset-2">
              개인정보처리방침
            </a>
            에 동의하는 것으로 간주됩니다
          </p>
        </div>
      </div>

      <footer className="border-t border-light px-5 py-5 text-center text-xs text-stone">
        © 2026 코드없이
      </footer>
    </main>
  )
}
