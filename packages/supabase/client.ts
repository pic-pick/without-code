import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''

// 브라우저(Web) / 서버 공통 클라이언트
// Next.js Server Component에서는 createServerClient(@supabase/ssr)를 사용할 것
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Mobile 전용 클라이언트 팩토리
// expo-secure-store를 storage로 주입받아 생성
// 사용: import { createMobileClient } from '@without-code/supabase'
//       const supabase = createMobileClient(secureStorage)
export function createMobileClient(secureStorage: {
  getItem: (key: string) => Promise<string | null>
  setItem: (key: string, value: string) => Promise<void>
  removeItem: (key: string) => Promise<void>
}) {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // 모바일은 딥링크로 처리
      storage: secureStorage,
    },
  })
}
