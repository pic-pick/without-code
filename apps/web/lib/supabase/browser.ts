import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@without-code/supabase'

// 브라우저(Client Component) 전용 싱글턴
// 모듈 레벨에서 한 번만 생성
let _client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getBrowserClient() {
  if (!_client) {
    _client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
  }
  return _client
}
