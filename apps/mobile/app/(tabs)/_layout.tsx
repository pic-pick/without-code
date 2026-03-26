import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'

// ── SVG 아이콘 (stroke-based) ─────────────────────────────
function IconHome({ focused }: { focused: boolean }) {
  return (
    <View style={styles.icon}>
      <Text style={[styles.iconStroke, focused && styles.iconFocused]}>⌂</Text>
    </View>
  )
}

// 탭 아이콘용 — SVG 미지원 환경에서 임시로 텍스트 사용
// Phase 2에서 react-native-svg로 교체
function TabIcon({
  label,
  focused,
  isUpload,
}: {
  label: string
  focused: boolean
  isUpload?: boolean
}) {
  if (isUpload) {
    return (
      <View style={styles.uploadBtn}>
        <Text style={styles.uploadBtnText}>+</Text>
      </View>
    )
  }
  return (
    <Text style={[styles.tabText, focused && styles.tabTextFocused]}>
      {label}
    </Text>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#1C1C1A',
        tabBarInactiveTintColor: '#888780',
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="○" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: '탐색',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="◎" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: '',
          tabBarIcon: () => <TabIcon label="+" isUpload focused={false} />,
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: '알림',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="◻" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ focused }) => (
            <TabIcon label="◈" focused={focused} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#F7F7F5',
    borderTopWidth: 1,
    borderTopColor: '#D3D1C7',
    height: 56,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  tabText: {
    fontSize: 20,
    color: '#888780',
  },
  tabTextFocused: {
    color: '#1C1C1A',
  },
  uploadBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8483A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  uploadBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 26,
  },
  icon: {},
  iconStroke: { fontSize: 20, color: '#888780' },
  iconFocused: { color: '#1C1C1A' },
})
