import { View, Text, StyleSheet, SafeAreaView } from 'react-native'

// 1-C 피드 구현 전 플레이스홀더
export default function HomeTab() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.text}>피드 준비 중</Text>
        <Text style={styles.sub}>1-C 구현 후 교체됩니다</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F5' },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  text: { fontSize: 18, fontWeight: '700', color: '#1C1C1A' },
  sub: { fontSize: 13, color: '#888780' },
})
