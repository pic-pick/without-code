'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getBrowserClient } from '@/lib/supabase/browser'
import {
  checkUsernameAvailable,
  suggestUsername,
  updateOnboardingProfile,
  uploadAvatar,
} from '@without-code/supabase'

// ── 상수 ──────────────────────────────────────────────────
const AI_TOOLS = [
  'Cursor', 'Claude', 'Lovable', 'Bolt', 'v0',
  'Replit', 'ChatGPT', 'Windsurf', 'GitHub Copilot',
  'Gemini', 'Perplexity', 'Midjourney', 'Runway',
]

const CATEGORIES = [
  '웹 앱', '모바일 앱', '랜딩 페이지', '자동화', 'SaaS',
  '크롬 익스텐션', '챗봇 / AI 에이전트', '데이터 분석',
  '디자인', '글쓰기', '게임', '커머스',
]

const TOTAL_STEPS = 5

// ── 서브컴포넌트 ──────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-7">
      <div className="mb-1.5 flex items-center gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-colors ${
              i < step
                ? 'bg-ink'
                : i === step - 1
                  ? 'bg-brand'
                  : 'bg-cloud'
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-stone">
        <span className="font-bold text-ink">{step}</span> / {TOTAL_STEPS}단계
      </p>
    </div>
  )
}

function ChipButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[8px] border-[1.5px] px-3.5 py-2 text-[14px] font-medium transition-colors ${
        selected
          ? 'border-ink bg-ink text-ivory font-semibold'
          : 'border-cloud bg-white text-charcoal hover:border-charcoal active:bg-light'
      }`}
    >
      {label}
    </button>
  )
}

// ── 메인 페이지 ───────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const { user, refreshProfile } = useAuth()
  const supabase = getBrowserClient()

  const [step, setStep] = useState(1)

  // Step 1: 약관 동의
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [marketingAgreed, setMarketingAgreed] = useState(false)

  // Step 2: 닉네임
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'ok' | 'taken' | 'invalid'
  >('idle')
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Step 3: 프로필 사진
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Step 4: AI 툴
  const [selectedTools, setSelectedTools] = useState<string[]>([])

  // Step 5: 카테고리
  const [selectedCats, setSelectedCats] = useState<string[]>([])

  const [submitting, setSubmitting] = useState(false)

  // 로그인 안 됐으면 로그인 화면으로
  useEffect(() => {
    if (user === null) router.replace('/login')
  }, [user, router])

  // 유저 이메일로 username 자동 제안
  useEffect(() => {
    if (user?.email && !username) {
      const suggested = suggestUsername(user.email)
      setUsername(suggested)
      validateUsername(suggested)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  function validateUsername(value: string) {
    if (usernameTimer.current) clearTimeout(usernameTimer.current)

    const trimmed = value.trim()
    if (trimmed.length < 3) {
      setUsernameStatus(trimmed.length === 0 ? 'idle' : 'invalid')
      return
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(trimmed)) {
      setUsernameStatus('invalid')
      return
    }

    setUsernameStatus('checking')
    usernameTimer.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(trimmed)
        setUsernameStatus(available ? 'ok' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 500)
  }

  function handleUsernameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setUsername(v)
    validateUsername(v)
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function toggleTool(tool: string) {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    )
  }

  function toggleCat(cat: string) {
    setSelectedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }

  function canProceed() {
    if (step === 1) return termsAgreed
    if (step === 2) return usernameStatus === 'ok'
    if (step === 3) return true // 선택 사항
    if (step === 4) return selectedTools.length >= 3
    if (step === 5) return selectedCats.length >= 1
    return false
  }

  async function handleSubmit() {
    if (!user || !canProceed()) return
    setSubmitting(true)

    try {
      let avatar_url: string | undefined
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop() ?? 'jpg'
        avatar_url = await uploadAvatar(user.id, avatarFile, ext)
      }

      await updateOnboardingProfile(user.id, {
        username: username.trim(),
        display_name: username.trim(),
        avatar_url,
        interest_tools: selectedTools,
        interest_cats: selectedCats,
        terms_agreed_at: new Date().toISOString(),
        marketing_agreed: marketingAgreed,
      })

      await refreshProfile()
      router.replace('/')
    } catch (err) {
      console.error('onboarding error', err)
      setSubmitting(false)
    }
  }

  function nextStep() {
    if (step < TOTAL_STEPS) setStep((s) => s + 1)
    else handleSubmit()
  }

  function prevStep() {
    if (step > 1) setStep((s) => s - 1)
  }

  if (!user) return null

  return (
    <div className="flex min-h-svh flex-col bg-ivory">
      {/* 상단 */}
      <div className="flex items-center justify-between border-b border-cloud bg-ivory px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[7px] bg-ink">
            <svg width="14" height="10" viewBox="0 0 16 12" fill="none">
              <path d="M5 1L1 6l4 5" stroke="#E8483A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 1l4 5-4 5" stroke="#E8483A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-extrabold tracking-tight">
            코드<span className="text-brand">없이</span>
          </span>
        </div>
        {step < TOTAL_STEPS && (
          <button
            onClick={() => router.replace('/')}
            className="text-[13px] font-semibold text-stone"
          >
            건너뛰기
          </button>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-5 pb-36 pt-7 md:mx-auto md:w-full md:max-w-[480px] md:px-0">
        <StepIndicator step={step} />

        {/* Step 1: 약관 동의 */}
        {step === 1 && (
          <div>
            <h2 className="mb-1.5 text-[22px] font-extrabold leading-snug tracking-tight">
              먼저 약관에
              <br />
              동의해 주세요
            </h2>
            <p className="mb-7 text-sm leading-relaxed text-stone">
              코드없이 서비스를 이용하려면 아래 약관 동의가 필요해요
            </p>

            <div className="flex flex-col gap-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border-[1.5px] border-cloud bg-white px-4 py-4">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-ink"
                  checked={termsAgreed && marketingAgreed}
                  onChange={(e) => {
                    setTermsAgreed(e.target.checked)
                    setMarketingAgreed(e.target.checked)
                  }}
                />
                <span className="text-sm font-semibold text-ink">전체 동의</span>
              </label>

              <div className="flex flex-col gap-2 pl-1">
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-ink"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                  />
                  <span className="text-sm text-charcoal">
                    <span className="font-semibold text-brand">[필수]</span>{' '}
                    이용약관 동의
                  </span>
                  <a href="/terms" className="ml-auto text-xs text-stone underline">
                    보기
                  </a>
                </label>

                <label className="flex cursor-pointer items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-ink"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    disabled
                  />
                  <span className="text-sm text-charcoal">
                    <span className="font-semibold text-brand">[필수]</span>{' '}
                    개인정보처리방침 동의
                  </span>
                  <a href="/privacy" className="ml-auto text-xs text-stone underline">
                    보기
                  </a>
                </label>

                <label className="flex cursor-pointer items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-ink"
                    checked={marketingAgreed}
                    onChange={(e) => setMarketingAgreed(e.target.checked)}
                  />
                  <span className="text-sm text-charcoal">
                    <span className="font-semibold text-stone">[선택]</span>{' '}
                    마케팅 정보 수신 동의
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 닉네임 */}
        {step === 2 && (
          <div>
            <h2 className="mb-1.5 text-[22px] font-extrabold leading-snug tracking-tight">
              어떻게 불러드릴까요?
            </h2>
            <p className="mb-7 text-sm leading-relaxed text-stone">
              코드없이에서 사용할 아이디를 정해주세요.
              <br />
              나중에 한 번 바꿀 수 있어요.
            </p>

            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder="username"
                maxLength={20}
                className={`w-full rounded-[10px] border-[1.5px] bg-white px-3.5 py-3 text-base text-ink outline-none transition-colors placeholder:text-stone focus:border-ink ${
                  usernameStatus === 'ok'
                    ? 'border-green-500'
                    : usernameStatus === 'taken' || usernameStatus === 'invalid'
                      ? 'border-brand'
                      : 'border-cloud'
                }`}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-stone">
                {username.length}/20
              </span>
            </div>

            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {usernameStatus === 'checking' && (
                <span className="text-stone">확인 중...</span>
              )}
              {usernameStatus === 'ok' && (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="7" fill="#22c55e" />
                    <path d="M3.5 7l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-green-600">사용할 수 있는 아이디예요</span>
                </>
              )}
              {usernameStatus === 'taken' && (
                <span className="text-brand">이미 사용 중인 아이디예요</span>
              )}
              {usernameStatus === 'invalid' && (
                <span className="text-brand">
                  3~20자, 영문·숫자·밑줄(_)만 사용 가능해요
                </span>
              )}
            </div>

            {usernameStatus === 'ok' && (
              <div className="mt-2.5 inline-flex items-center gap-1 rounded-[6px] bg-light px-2.5 py-1.5 text-xs text-stone">
                withoutcode.kr/
                <span className="font-bold text-ink">{username}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 3: 프로필 사진 */}
        {step === 3 && (
          <div>
            <h2 className="mb-1.5 text-[22px] font-extrabold leading-snug tracking-tight">
              프로필 사진을
              <br />
              설정해볼까요?
            </h2>
            <p className="mb-7 text-sm leading-relaxed text-stone">
              선택 사항이에요. 나중에 언제든지 변경할 수 있어요.
            </p>

            <div className="flex flex-col items-center gap-5">
              {/* 미리보기 */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-cloud bg-light transition-colors hover:border-charcoal"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="프로필 미리보기"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="13" r="6" stroke="#888780" strokeWidth="1.6" />
                    <path d="M4 28c0-6 5.4-10 12-10s12 4 12 10" stroke="#888780" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-[9px] border-[1.5px] border-cloud bg-light px-5 py-2.5 text-sm font-semibold text-charcoal transition-colors hover:border-charcoal active:bg-cloud"
              >
                사진 선택
              </button>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setAvatarFile(null)
                    setAvatarPreview(null)
                  }}
                  className="text-xs text-stone underline"
                >
                  사진 제거
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 4: AI 툴 */}
        {step === 4 && (
          <div>
            <h2 className="mb-1.5 text-[22px] font-extrabold leading-snug tracking-tight">
              주로 어떤 AI 툴을
              <br />
              쓰세요?
            </h2>
            <p className="mb-7 text-sm leading-relaxed text-stone">
              3개 이상 선택해주세요. 관심 있는 툴을 모두 골라도 돼요.
            </p>

            <div className="flex flex-wrap gap-2">
              {AI_TOOLS.map((tool) => (
                <ChipButton
                  key={tool}
                  label={tool}
                  selected={selectedTools.includes(tool)}
                  onClick={() => toggleTool(tool)}
                />
              ))}
            </div>

            {selectedTools.length > 0 && selectedTools.length < 3 && (
              <p className="mt-4 text-xs text-stone">
                {3 - selectedTools.length}개 더 선택해주세요
              </p>
            )}
          </div>
        )}

        {/* Step 5: 카테고리 */}
        {step === 5 && (
          <div>
            <h2 className="mb-1.5 text-[22px] font-extrabold leading-snug tracking-tight">
              어떤 것들을
              <br />
              만드나요?
            </h2>
            <p className="mb-7 text-sm leading-relaxed text-stone">
              관심 분야를 모두 선택해주세요.
            </p>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <ChipButton
                  key={cat}
                  label={cat}
                  selected={selectedCats.includes(cat)}
                  onClick={() => toggleCat(cat)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 하단 CTA */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-cloud bg-ivory px-5 py-3 pb-[calc(12px+env(safe-area-inset-bottom))] md:mx-auto md:max-w-[480px] md:border-x">
        <div className="flex gap-2">
          {step > 1 && (
            <button
              onClick={prevStep}
              className="flex-shrink-0 rounded-[10px] border-[1.5px] border-cloud bg-light px-[18px] py-[15px] text-base font-semibold text-charcoal transition-colors active:bg-cloud"
            >
              이전
            </button>
          )}
          <button
            onClick={nextStep}
            disabled={!canProceed() || submitting}
            className="flex-1 rounded-[10px] bg-ink py-[15px] text-base font-bold text-ivory transition-colors disabled:cursor-not-allowed disabled:opacity-40 active:bg-charcoal"
          >
            {submitting
              ? '저장 중...'
              : step === TOTAL_STEPS
                ? '시작하기'
                : step === 4
                  ? `다음 — ${selectedTools.length}개 선택됨`
                  : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}
