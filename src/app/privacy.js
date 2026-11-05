import { useState, useEffect } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import FeaturePage, { ui } from '../components/FeaturePage';
export default function PrivacyRoute() {
 const configured = Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
 const [generation, setGeneration] = useState(0);
 useEffect(() => {
  if (!configured) return;
  const { onPrivacyReset } = require('../features/privacy/lib/privacyApi');
  return onPrivacyReset(() => setGeneration((value) => value + 1));
 }, [configured]);
 if (!configured) return <FeaturePage title="Privacy & data."><Text style={ui.body}>Your wardrobe, quiz, avatar, saved looks and analysis history are stored on this device. Photo recognition uploads photos to its configured service; try-on and AI analysis send selected photos when requested. Shopping and AI search send their search inputs.</Text><Text style={ui.body}>Cloud privacy controls are unavailable until Supabase and the privacy backend are configured. No cloud retention, sharing or deletion setting is currently applied to the local wardrobe or independent AI services.</Text><Text style={ui.body}>Setup: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY and EXPO_PUBLIC_ACTIVITY_API_URL. See the integration report for backend setup.</Text></FeaturePage>;
 const { PrivacyDataScreen } = require('../features/privacy/App');
 return <View style={{ flex: 1 }}><Text style={[ui.body, { padding: 16 }]}>Cloud-managed photos and preferences. Independent recognition, analysis and try-on services have separate storage; these controls do not govern those uploads or your local wardrobe.</Text><PrivacyDataScreen key={generation} onBack={() => router.canGoBack() ? router.back() : router.replace('/')} /></View>;
}
