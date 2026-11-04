import { activityApiUrl } from './activityConfig';
import { getUserId } from './closetVisibility';
import { supabase } from './supabase';

export async function privacyRequest(path: string, init: RequestInit = {}) {
  if (!activityApiUrl) throw new Error('The privacy backend URL is not configured.');
  await getUserId();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session) throw new Error('Your session is not ready.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${activityApiUrl}${path}`, { ...init, headers, signal: controller.signal });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || body.message || 'The request failed. Please try again.');
    }
    return response;
  } finally { clearTimeout(timer); }
}

type Listener = () => void;
const listeners = new Set<Listener>();
export function onPrivacyReset(listener: Listener) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function resetPrivacyScreen() { listeners.forEach(listener => listener()); }
