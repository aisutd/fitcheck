import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
export default function FeaturePage({ title, children }) {
 return <SafeAreaView style={ui.page}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}><Pressable accessibilityRole="button" onPress={() => router.canGoBack() ? router.back() : router.replace('/')} style={ui.button}><Text style={ui.link}>← Back to FitCheck</Text></Pressable><Text accessibilityRole="header" style={ui.title}>{title}</Text>{children}</ScrollView></SafeAreaView>;
}
export const ui = StyleSheet.create({ page: { flex: 1, backgroundColor: theme.paper }, content: { width: '100%', maxWidth: 780, alignSelf: 'center', padding: 24, paddingBottom: 48, gap: 16 }, title: { fontFamily: 'serif', fontSize: 36, color: theme.ink }, body: { color: theme.muted, fontSize: 14, lineHeight: 22 }, link: { color: theme.ink, fontSize: 14 }, button: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: theme.line, borderRadius: 3, justifyContent: 'center' }, input: { minHeight: 48, padding: 12, borderWidth: 1, borderColor: theme.line, color: theme.ink }, card: { padding: 18, borderWidth: 1, borderColor: theme.line, borderRadius: 3, gap: 12 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, error: { color: theme.error, lineHeight: 22 }, image: { width: '100%', height: 300 }, disabled: { opacity: 0.45 } });
