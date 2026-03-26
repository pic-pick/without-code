import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// 이미 로그인된 유저는 메인으로
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    // 온보딩 완료 여부 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_completed) {
      redirect('/')
    } else {
      redirect('/onboarding')
    }
  }

  return <>{children}</>
}
