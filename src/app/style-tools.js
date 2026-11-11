import { router, useLocalSearchParams } from 'expo-router';
import StyleToolsScreen from '../screens/StyleToolsScreen';
export default function StyleToolsRoute() {
  const { mode } = useLocalSearchParams();
  return <StyleToolsScreen mode={mode === 'demo' ? 'demo' : 'personal'} onClose={() => router.canGoBack() ? router.back() : router.replace('/')} />;
}
