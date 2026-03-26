import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from '../_layout'

WebBrowser.maybeCompleteAuthSession()

type OAuthProvider = 'kakao' | 'google' | 'github'

const PROVIDERS: {
  id: OAuthProvider
  label: string
  bg: string
  textColor: string
  borderColor: string
}[] = [
  {
    id: 'kakao',
    label: '카카오로 계속하기',
    bg: '#FEE500',
    textColor: '#1A1A1A',
    borderColor: '#FEE500',
  },
  {
    id: 'google',
    label: 'Google로 계속하기',
    bg: '#FFFFFF',
    textColor: '#1C1C1A',
    borderColor: '#D3D1C7',
  },
  {
    id: 'github',
    label: 'GitHub으로 계속하기',
    bg: '#FFFFFF',
    textColor: '#1C1C1A',
    borderColor: '#D3D1C7',
  },
]

export default function LoginScreen() {
  const [loading, setLoading] = useState<OAuthProvider | null>(null)

  async function handleOAuth(provider: OAuthProvider) {
    setLoading(provider)
    try {
      const redirectTo = Linking.createURL('/auth/callback')
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          scopes: provider === 'github' ? 'read:user user:email' : undefined,
          skipBrowserRedirect: true,
        },
      })

      if (error) throw error
      if (!data.url) throw new Error('OAuth URL을 가져오지 못했어요')

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

      if (result.type === 'success') {
        const url = result.url
        const params = new URL(url)
        const accessToken = params.searchParams.get('access_token')
        const refreshToken = params.searchParams.get('refresh_token')

        if (accessToken && refreshToken) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
        }
      }
    } catch (err) {
      Alert.alert('로그인 오류', '로그인 중 문제가 발생했어요. 다시 시도해주세요.')
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 로고 */}
      <View style={styles.nav}>
        <View style={styles.logoMark}>
          <Text style={styles.logoCode}>{'</>'}</Text>
        </View>
        <Text style={styles.logoName}>
          코드<Text style={styles.logoAccent}>없이</Text>
        </Text>
      </View>

      <View style={styles.body}>
        {/* 헤딩 */}
        <View style={styles.header}>
          <Text style={styles.title}>코드없이에{'\n'}오신 걸 환영해요</Text>
          <Text style={styles.subtitle}>
            AI로 만든 것을 공유하고,{'\n'}프롬프트를 나누고, 함께 성장하세요
          </Text>
        </View>

        {/* OAuth 버튼 */}
        <View style={styles.btns}>
          {PROVIDERS.map(({ id, label, bg, textColor, borderColor }) => (
            <TouchableOpacity
              key={id}
              onPress={() => handleOAuth(id)}
              disabled={loading !== null}
              activeOpacity={0.7}
              style={[
                styles.oauthBtn,
                {
                  backgroundColor: bg,
                  borderColor,
                  opacity: loading !== null ? 0.6 : 1,
                },
              ]}
            >
              {loading === id ? (
                <ActivityIndicator size="small" color={textColor} />
              ) : (
                <View style={styles.oauthIcon} />
              )}
              <Text style={[styles.oauthLabel, { color: textColor }]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 약관 */}
        <Text style={styles.legal}>
          계속 진행하면 이용약관과 개인정보처리방침에{'\n'}동의하는 것으로 간주됩니다
        </Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F5',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#D3D1C7',
  },
  logoMark: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#1C1C1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCode: {
    color: '#E8483A',
    fontSize: 12,
    fontWeight: '700',
  },
  logoName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1C1C1A',
    letterSpacing: -0.3,
  },
  logoAccent: {
    color: '#E8483A',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1C1C1A',
    letterSpacing: -0.4,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888780',
    lineHeight: 22,
  },
  btns: {
    width: '100%',
    maxWidth: 400,
    gap: 10,
    marginBottom: 20,
  },
  oauthBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  oauthIcon: {
    width: 22,
    height: 22,
  },
  oauthLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  legal: {
    fontSize: 12,
    color: '#888780',
    textAlign: 'center',
    lineHeight: 20,
  },
})
