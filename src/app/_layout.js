import { Tabs, Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { FitCheckProvider, useFitCheck } from '../state/FitCheckProvider';
import { palette } from '../theme/tokens';

const sections = { index: 'Outfits', wardrobe: 'Wardrobe', avatar: 'Avatar', quiz: 'Know you' };
function Navigation({ state }) {
  const { loading, wardrobeReady, avatarReady, storageReady } = useFitCheck();
  const available = { index: true, wardrobe: wardrobeReady, avatar: avatarReady, quiz: storageReady };
  return (
    <SafeAreaView edges={['bottom']} style={styles.navArea}>
      <View style={styles.navigation}>
        {state.routes.map((route, index) => {
          const active = index === state.index;
          const disabled = loading || !available[route.name];
          return (
            <Link key={route.key} href={route.name === 'index' ? '/' : `/${route.name}`} asChild>
              <Pressable disabled={disabled} accessibilityRole="tab" accessibilityState={{ selected: active, disabled }} style={StyleSheet.flatten([styles.tab, active && styles.active, disabled && styles.disabled])}>
                <Text style={[styles.tabText, active && styles.activeText]}>{sections[route.name]}</Text>
              </Pressable>
            </Link>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
function Shell() {
  const { wardrobeState } = useFitCheck();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.shell}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.wordmark}>fitcheck<Text style={styles.dot}>.</Text></Text>
        <Text style={styles.mode}>{wardrobeState.mode === 'demo' ? 'DEMO CLOSET' : 'YOUR STYLE SPACE'}</Text>
      </View>
      <Tabs tabBar={(props) => <Navigation {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: palette.background } }}>
        <Tabs.Screen name="index" options={{ title: 'Outfits' }} />
        <Tabs.Screen name="wardrobe" options={{ title: 'Wardrobe' }} />
        <Tabs.Screen name="avatar" options={{ title: 'Avatar' }} />
        <Tabs.Screen name="quiz" options={{ title: 'Know you' }} />
      </Tabs>
    </SafeAreaView>
  );
}
export default function RootLayout() {
  return <SafeAreaProvider><FitCheckProvider><Shell /></FitCheckProvider></SafeAreaProvider>;
}
const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: palette.background },
  header: { width: '100%', maxWidth: 1120, alignSelf: 'center', paddingHorizontal: 22, minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: palette.line },
  wordmark: { color: palette.ink, fontSize: 29, fontWeight: '800', letterSpacing: -1.4 },
  dot: { color: palette.accent },
  mode: { color: palette.muted, fontSize: 9, letterSpacing: 1.2, fontWeight: '700' },
  navArea: { backgroundColor: palette.paper, borderTopWidth: 1, borderTopColor: palette.line },
  navigation: { flexDirection: 'row', width: '100%', maxWidth: 760, alignSelf: 'center' },
  tab: { flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', borderTopWidth: 2, borderTopColor: 'transparent' },
  active: { borderTopColor: palette.accent, backgroundColor: palette.soft },
  tabText: { color: palette.muted, fontSize: 12, fontWeight: '600' },
  activeText: { color: palette.accent, fontWeight: '800' },
  disabled: { opacity: 0.4 },
});
