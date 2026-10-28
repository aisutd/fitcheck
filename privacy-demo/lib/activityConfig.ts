import { Platform } from 'react-native';

// Mobile/hosted builds must use an explicitly configured reachable backend URL.
export const activityApiUrl = (process.env.EXPO_PUBLIC_ACTIVITY_API_URL
  ?? (Platform.OS === 'web' && __DEV__ ? 'http://127.0.0.1:8000' : '')).replace(/\/$/, '');
