import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TryOnResultProvider } from '../TryOnResultContext';
export default function Layout() {
  return <SafeAreaProvider><TryOnResultProvider><Stack screenOptions={{ headerShown: false }} /></TryOnResultProvider></SafeAreaProvider>;
}
