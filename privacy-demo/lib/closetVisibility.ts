import { supabase } from './supabase';

export type ClosetVisibility = 'Private' | 'Friends Only' | 'Public';

// Share initialization so development remounts do not create multiple users.
let userPromise: Promise<string> | null = null;

export async function getUserId(): Promise<string> {
  if (!userPromise) {
    userPromise = (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session) return data.session.user.id;

      // Standalone demo only. Integration will reuse the main app's session.
      const result = await supabase.auth.signInAnonymously();
      if (result.error) throw result.error;
      if (!result.data.user) throw new Error('Could not start a user session.');
      return result.data.user.id;
    })().catch(error => {
      userPromise = null;
      throw error;
    });
  }
  return userPromise;
}

export async function loadClosetVisibility(): Promise<ClosetVisibility> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('privacy_settings')
    .select('closet_visibility')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return 'Private';
  const value = data.closet_visibility;
  if (value !== 'Private' && value !== 'Friends Only' && value !== 'Public') {
    throw new Error('The saved closet visibility is invalid.');
  }
  return value;
}

export async function saveClosetVisibility(value: ClosetVisibility): Promise<void> {
  const userId = await getUserId();
  const created = await supabase.from('privacy_settings').upsert({
    user_id: userId,
  }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (created.error) throw created.error;
  const { error } = await supabase.from('privacy_settings')
    .update({ closet_visibility: value }).eq('user_id', userId)
    .select('user_id').single();
  if (error) throw error;
}

export function visibilityError(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Could not reach Supabase. Check your connection and try again.';
}
