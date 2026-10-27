import { router, useLocalSearchParams } from 'expo-router';
import ShoppingScreen from '../screens/ShoppingScreen';
export default function ShoppingRoute() {
  const params = useLocalSearchParams();
  const one = (value) => typeof value === 'string' ? value : '';
  return <ShoppingScreen occasion={one(params.occasion) || 'Date Night'} initialCategory={one(params.category)}
    style={one(params.style)} missing={one(params.missing).split(',')}
    onClose={() => router.canGoBack() ? router.back() : router.replace('/')} />;
}
