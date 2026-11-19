import { Stack } from 'expo-router';
import { FitCheckProvider } from '../../App';
export default function RootLayout() {
  return <FitCheckProvider><Stack screenOptions={{ headerShown: false }} /></FitCheckProvider>;
}
