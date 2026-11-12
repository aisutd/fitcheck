import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
export default function FeaturePage({ title, children }) {
 const insets = useSafeAreaInsets();
 return <SafeAreaView style={ui.page}>
  <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>
   <Text accessibilityRole="header" style={ui.title}>{title}</Text>{children}
  </ScrollView>
  <Pressable accessibilityRole="button" accessibilityLabel="Back to FitCheck home" onPress={() => router.replace('/')} style={[ui.homeButton, { bottom: insets.bottom + 16 }]}>
   <Ionicons name="home-outline" size={26} color={theme.paper} />
  </Pressable>
 </SafeAreaView>;
}
export const ui = StyleSheet.create({ page: { flex: 1, backgroundColor: theme.paper }, content: { width: '100%', maxWidth: 780, alignSelf: 'center', padding: 24, paddingBottom: 104, gap: 16 }, homeButton: { position: 'absolute', right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.ink, alignItems: 'center', justifyContent: 'center', zIndex: 100, elevation: 8 }, title: { textAlign: 'left', fontFamily: 'serif', fontSize: 36, color: theme.ink }, body: { color: theme.muted, fontSize: 14, lineHeight: 22 }, link: { color: theme.ink, fontSize: 14 }, button: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: theme.line, borderRadius: 3, justifyContent: 'center' }, input: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: theme.line, color: theme.ink }, card: { padding: 18, borderWidth: 1, borderColor: theme.line, borderRadius: 3, gap: 12 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, error: { color: theme.error, lineHeight: 22 }, image: { width: '100%', height: 300 }, disabled: { opacity: 0.45 } });
