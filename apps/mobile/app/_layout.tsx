import { useEffect, useState } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import * as WebBrowser from 'expo-web-browser'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { createMobileClient } from '@without-code/supabase'
import type { Session } from '@supabase/supabase-js'
import '../global.css'

// Pretendard 폰트 파일은 assets/fonts/ 에 위치해야 합니다.
// 다운로드: https://github.com/orioncactus/pretendard/releases
// 필요 파일: Pretendard-Regular.otf, Pretendard-Medium.otf,
//            Pretendard-SemiBold.otf, Pretendard-Bold.otf

SplashScreen.preventAutoHideAsync()

WebBrowser.maybeCompleteAuthSession()

const secureStorage = {
  async getItem(key: string) {
    return SecureStore.getItemAsync(key)
  },
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(key, value)
  },
  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(key)
  },
}

export const supabase = createMobileClient(secureStorage)

function useProtectedRoute(session: Session | null, ready: boolean) {
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (!ready) return

    const inAuthGroup = segments[0] === '(auth)'
    const inOnboarding = segments[1] === 'onboarding'

    if (!session) {
      if (!inAuthGroup) router.replace('/(auth)/login')
      return
    }

    // 로그인 됨 → 온보딩 완료 여부 확인
    supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (!data?.onboarding_completed) {
          // 온보딩 미완료 → 온보딩 화면으로
          if (!inOnboarding) router.replace('/(auth)/onboarding')
        } else {
          // 온보딩 완료 → auth 그룹이면 메인으로
          if (inAuthGroup) router.replace('/(tabs)')
        }
      })
  // segments 변경마다 재실행하면 무한 루프 가능 → session/ready 변경 시에만
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, ready])
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)

  const [fontsLoaded] = useFonts({
    'Pretendard-Regular':  require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-Medium':   require('../assets/fonts/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold':     require('../assets/fonts/Pretendard-Bold.otf'),
  })

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setReady(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  useProtectedRoute(session, ready)

  if (!fontsLoaded || !ready) return null

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  )
}
