import { supabase } from '../client'

export type OAuthProvider = 'kakao' | 'google' | 'github'

// ── OAuth 로그인 ──────────────────────────────────────────
export async function signInWithOAuth(
  provider: OAuthProvider,
  redirectTo: string,
) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      scopes: provider === 'github' ? 'read:user user:email' : undefined,
    },
  })
}

// ── 로그아웃 ──────────────────────────────────────────────
export async function signOut(scope: 'local' | 'global' = 'local') {
  return supabase.auth.signOut({ scope })
}

// ── 유저네임 중복 확인 (true = 사용 가능) ─────────────────
export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (error) throw error
  return data === null
}

// ── 이메일로 유저네임 자동 제안 ────────────────────────────
export function suggestUsername(email: string): string {
  const local = email.split('@')[0]
  const clean = local.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()
  return clean.slice(0, 20)
}

// ── 온보딩 프로필 업데이트 ────────────────────────────────
export async function updateOnboardingProfile(
  userId: string,
  data: {
    username: string
    display_name: string
    avatar_url?: string
    interest_tools: string[]
    interest_cats: string[]
    terms_agreed_at: string
    marketing_agreed: boolean
  },
) {
  const { error } = await supabase
    .from('profiles')
    .update({
      username: data.username,
      display_name: data.display_name,
      avatar_url: data.avatar_url ?? null,
      interest_tools: data.interest_tools,
      interest_cats: data.interest_cats,
      terms_agreed_at: data.terms_agreed_at,
      marketing_agreed: data.marketing_agreed,
      onboarding_completed: true,
    })
    .eq('id', userId)

  if (error) throw error
}

// ── 프로필 조회 ───────────────────────────────────────────
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

// ── 아바타 업로드 (Storage: avatars 버킷) ─────────────────
export async function uploadAvatar(userId: string, file: Blob, ext: string) {
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
