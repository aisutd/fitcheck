import { useState, useEffect } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { ui } from '../components/FeaturePage';
import { PrivacyDataScreen } from '../features/privacy/App';
import { onPrivacyReset } from '../features/privacy/lib/privacyApi';
export default function PrivacyRoute() {
 const [generation, setGeneration] = useState(0);
 useEffect(() => {
  return onPrivacyReset(() => setGeneration((value) => value + 1));
 }, []);
 return <View style={{ flex: 1 }}><Text style={[ui.body, { padding: 16 }]}>Cloud-managed photos and preferences. Independent recognition, analysis and try-on services have separate storage; these controls do not govern those uploads or your local wardrobe.</Text><PrivacyDataScreen key={generation} onBack={() => router.canGoBack() ? router.back() : router.replace('/')} /></View>;
}
