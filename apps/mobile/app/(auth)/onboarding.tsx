import { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../_layout'
import {
  checkUsernameAvailable,
  suggestUsername,
  updateOnboardingProfile,
} from '@without-code/supabase'
import { useAuth } from '../../hooks/useAuth'

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

export default function OnboardingScreen() {
  const router = useRouter()
  const { user, refreshProfile } = useAuth()

  const [step, setStep] = useState(1)

  // Step 1
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [marketingAgreed, setMarketingAgreed] = useState(false)

  // Step 2
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<
    'idle' | 'checking' | 'ok' | 'taken' | 'invalid'
  >('idle')
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Step 4
  const [selectedTools, setSelectedTools] = useState<string[]>([])

  // Step 5
  const [selectedCats, setSelectedCats] = useState<string[]>([])

  const [submitting, setSubmitting] = useState(false)

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
        const ok = await checkUsernameAvailable(trimmed)
        setUsernameStatus(ok ? 'ok' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 500)
  }

  function toggleChip(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
  }

  function canProceed() {
    if (step === 1) return termsAgreed
    if (step === 2) return usernameStatus === 'ok'
    if (step === 3) return true
    if (step === 4) return selectedTools.length >= 3
    if (step === 5) return selectedCats.length >= 1
    return false
  }

  async function handleSubmit() {
    if (!user || !canProceed()) return
    setSubmitting(true)
    try {
      await updateOnboardingProfile(user.id, {
        username: username.trim(),
        display_name: username.trim(),
        interest_tools: selectedTools,
        interest_cats: selectedCats,
        terms_agreed_at: new Date().toISOString(),
        marketing_agreed: marketingAgreed,
      })
      await refreshProfile()
      router.replace('/(tabs)')
    } catch (err) {
      Alert.alert('오류', '저장 중 문제가 발생했어요. 다시 시도해주세요.')
      console.error(err)
      setSubmitting(false)
    }
  }

  function nextStep() {
    if (step < TOTAL_STEPS) setStep((s) => s + 1)
    else handleSubmit()
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progBar,
                i < step
                  ? styles.progDone
                  : i === step - 1
                    ? styles.progActive
                    : styles.progIdle,
              ]}
            />
          ))}
        </View>
        <Text style={styles.progLabel}>
          <Text style={styles.progLabelBold}>{step}</Text> / {TOTAL_STEPS}단계
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1: 약관 */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>먼저 약관에{'\n'}동의해 주세요</Text>
            <Text style={styles.stepSub}>
              코드없이 서비스를 이용하려면 아래 약관 동의가 필요해요
            </Text>

            <TouchableOpacity
              style={styles.termCard}
              onPress={() => {
                const v = !(termsAgreed && marketingAgreed)
                setTermsAgreed(v)
                setMarketingAgreed(v)
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, termsAgreed && marketingAgreed && styles.checkboxOn]} />
              <Text style={styles.termLabel}>전체 동의</Text>
            </TouchableOpacity>

            <View style={styles.termItems}>
              {[
                { key: 'terms', label: '[필수] 이용약관 동의', checked: termsAgreed, onPress: () => setTermsAgreed(!termsAgreed) },
                { key: 'mkt', label: '[선택] 마케팅 정보 수신 동의', checked: marketingAgreed, onPress: () => setMarketingAgreed(!marketingAgreed) },
              ].map(({ key, label, checked, onPress }) => (
                <TouchableOpacity
                  key={key}
                  style={styles.termItem}
                  onPress={onPress}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxOn]} />
                  <Text style={styles.termItemLabel}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 2: 닉네임 */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>어떻게 불러드릴까요?</Text>
            <Text style={styles.stepSub}>
              코드없이에서 사용할 아이디를 정해주세요.{'\n'}나중에 한 번 바꿀 수 있어요.
            </Text>

            <TextInput
              style={[
                styles.input,
                usernameStatus === 'ok' && styles.inputOk,
                (usernameStatus === 'taken' || usernameStatus === 'invalid') &&
                  styles.inputError,
              ]}
              value={username}
              onChangeText={(v) => {
                setUsername(v)
                validateUsername(v)
              }}
              placeholder="username"
              placeholderTextColor="#888780"
              maxLength={20}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.inputHint}>
              {usernameStatus === 'checking' && '확인 중...'}
              {usernameStatus === 'ok' && '✓ 사용할 수 있는 아이디예요'}
              {usernameStatus === 'taken' && '이미 사용 중인 아이디예요'}
              {usernameStatus === 'invalid' && '3~20자, 영문·숫자·밑줄(_)만 사용 가능해요'}
            </Text>
          </View>
        )}

        {/* Step 3: 프로필 사진 (선택) */}
        {step === 3 && (
          <View style={styles.avatarStep}>
            <Text style={styles.stepTitle}>프로필 사진을{'\n'}설정해볼까요?</Text>
            <Text style={styles.stepSub}>
              선택 사항이에요. 나중에 언제든지 변경할 수 있어요.
            </Text>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarPlaceholder}>👤</Text>
            </View>
            <Text style={styles.avatarNote}>
              프로필 사진은 설정 화면에서 변경할 수 있어요
            </Text>
          </View>
        )}

        {/* Step 4: AI 툴 */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>주로 어떤 AI 툴을{'\n'}쓰세요?</Text>
            <Text style={styles.stepSub}>3개 이상 선택해주세요.</Text>
            <View style={styles.chips}>
              {AI_TOOLS.map((tool) => (
                <TouchableOpacity
                  key={tool}
                  onPress={() => toggleChip(selectedTools, setSelectedTools, tool)}
                  activeOpacity={0.7}
                  style={[
                    styles.chip,
                    selectedTools.includes(tool) && styles.chipOn,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedTools.includes(tool) && styles.chipTextOn,
                    ]}
                  >
                    {tool}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedTools.length > 0 && selectedTools.length < 3 && (
              <Text style={styles.chipHint}>
                {3 - selectedTools.length}개 더 선택해주세요
              </Text>
            )}
          </View>
        )}

        {/* Step 5: 카테고리 */}
        {step === 5 && (
          <View>
            <Text style={styles.stepTitle}>어떤 것들을{'\n'}만드나요?</Text>
            <Text style={styles.stepSub}>관심 분야를 모두 선택해주세요.</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => toggleChip(selectedCats, setSelectedCats, cat)}
                  activeOpacity={0.7}
                  style={[
                    styles.chip,
                    selectedCats.includes(cat) && styles.chipOn,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedCats.includes(cat) && styles.chipTextOn,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* 하단 CTA */}
      <View style={styles.bottomCta}>
        <View style={styles.btnRow}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => setStep((s) => s - 1)}
              activeOpacity={0.7}
            >
              <Text style={styles.btnSecondaryText}>이전</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.btnPrimary, (!canProceed() || submitting) && styles.btnDisabled]}
            onPress={nextStep}
            disabled={!canProceed() || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#F7F7F5" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>
                {step === TOTAL_STEPS
                  ? '시작하기'
                  : step === 4
                    ? `다음 — ${selectedTools.length}개 선택됨`
                    : '다음'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  )
}

const INK = '#1C1C1A'
const RED = '#E8483A'
const WHITE = '#F7F7F5'
const STONE = '#888780'
const CLOUD = '#D3D1C7'
const LIGHT = '#F2F0EB'

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: WHITE },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 0 },
  progressRow: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  progBar: { flex: 1, height: 3, borderRadius: 2 },
  progDone: { backgroundColor: INK },
  progActive: { backgroundColor: RED },
  progIdle: { backgroundColor: CLOUD },
  progLabel: { fontSize: 12, color: STONE, marginBottom: 0 },
  progLabelBold: { fontWeight: '700', color: INK },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 120 },
  stepTitle: {
    fontSize: 22, fontWeight: '800', color: INK,
    letterSpacing: -0.4, lineHeight: 30, marginBottom: 6,
  },
  stepSub: {
    fontSize: 14, color: STONE, lineHeight: 22, marginBottom: 28,
  },

  // Terms
  termCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: CLOUD, borderRadius: 10,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16,
    marginBottom: 8,
  },
  termItems: { paddingLeft: 4, gap: 4 },
  termItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  checkbox: {
    width: 16, height: 16, borderRadius: 4,
    borderWidth: 1.5, borderColor: CLOUD, backgroundColor: '#fff',
  },
  checkboxOn: { backgroundColor: INK, borderColor: INK },
  termLabel: { fontSize: 14, fontWeight: '600', color: INK },
  termItemLabel: { fontSize: 13, color: '#444441', flex: 1 },

  // Username
  input: {
    borderWidth: 1.5, borderColor: CLOUD, borderRadius: 10,
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 16, color: INK,
  },
  inputOk: { borderColor: '#22c55e' },
  inputError: { borderColor: RED },
  inputHint: { fontSize: 12, color: STONE, marginTop: 8 },

  // Avatar
  avatarStep: { alignItems: 'center' },
  avatarCircle: {
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: LIGHT, borderWidth: 2, borderStyle: 'dashed',
    borderColor: CLOUD, alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: { fontSize: 36 },
  avatarNote: { fontSize: 13, color: STONE, textAlign: 'center' },

  // Chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 8, borderWidth: 1.5, borderColor: CLOUD,
    backgroundColor: '#fff',
  },
  chipOn: { backgroundColor: INK, borderColor: INK },
  chipText: { fontSize: 14, fontWeight: '500', color: '#444441' },
  chipTextOn: { color: WHITE, fontWeight: '600' },
  chipHint: { fontSize: 12, color: STONE, marginTop: 12 },

  // Bottom CTA
  bottomCta: {
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: CLOUD, backgroundColor: WHITE,
  },
  btnRow: { flexDirection: 'row', gap: 8 },
  btnSecondary: {
    paddingVertical: 15, paddingHorizontal: 18,
    borderRadius: 10, borderWidth: 1.5, borderColor: CLOUD,
    backgroundColor: LIGHT,
  },
  btnSecondaryText: { fontSize: 16, fontWeight: '600', color: '#444441' },
  btnPrimary: {
    flex: 1, paddingVertical: 15, borderRadius: 10,
    backgroundColor: INK, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: WHITE },
  btnDisabled: { opacity: 0.4 },
})
