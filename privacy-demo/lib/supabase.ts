import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { activityApiUrl } from './activityConfig';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error('Missing Supabase settings in .env.local');
}

export const supabase = createClient(url, key, {
  global: {
    // Avoid leaving the screen stuck on a network request indefinitely.
    fetch: async (input, init) => {
      const controller = new AbortController();
      const abort = () => controller.abort();
      const signal = init?.signal;
      if (signal?.aborted) controller.abort();
      signal?.addEventListener('abort', abort, { once: true });
      const timeout = setTimeout(abort, 15000);
      try {
        const original = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const destination = new URL(original);
        if (activityApiUrl && destination.origin === new URL(url).origin
            && destination.pathname === '/rest/v1/privacy_settings') {
          // Auth goes directly to Supabase. Data requests go through the verified
          // activity gateway, preserving the user's JWT and existing RLS.
          return await fetch(`${activityApiUrl}${destination.pathname}${destination.search}`,
            { ...init, signal: controller.signal });
        }
        return await fetch(input, { ...init, signal: controller.signal });
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', abort);
      }
    },
  },
  auth: {
    ...(Platform.OS !== 'web' ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
