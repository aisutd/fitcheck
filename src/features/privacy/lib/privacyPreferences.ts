import { useEffect, useRef, useState } from 'react';
import { getUserId, visibilityError } from './closetVisibility';
import { supabase } from './supabase';
import { MockData } from '../privacyData';

export type DemoRecords = Omit<MockData, 'memory'>;
export const initialDemoRecords: DemoRecords = {
  closet: [], bodyPhotos: [], tryOns: [], chats: [], outfits: [],
};

export const retentionOptions = ['After processing', 'After 24 hours', 'Keep until I delete'] as const;
type Preferences = {
  photo_retention: typeof retentionOptions[number];
  ai_training_consent: boolean;
  private_mirror: boolean;
  blur_faces: boolean;
  blur_background: boolean;
  strip_location: boolean;
  personalized_suggestions: boolean;
  retailer_sharing: boolean;
  saved_memory: { style: string; size: string; budget: string };
  demo_records: DemoRecords;
};

const defaults: Preferences = {
  photo_retention: 'After processing', ai_training_consent: false,
  private_mirror: true, blur_faces: true, blur_background: true,
  strip_location: true, personalized_suggestions: true, retailer_sharing: false,
  saved_memory: { style: '', size: '', budget: '' },
  demo_records: initialDemoRecords,
};

export function validatePreference<K extends keyof Preferences>(field: K, value: unknown): asserts value is Preferences[K] {
  let valid: boolean;
  if (field === 'photo_retention') valid = retentionOptions.includes(value as Preferences['photo_retention']);
  else if (field === 'demo_records') {
    const records = value as DemoRecords | null;
    valid = !!records && ['bodyPhotos', 'tryOns', 'chats'].every(key => {
      const list = records[key as 'bodyPhotos' | 'tryOns' | 'chats'];
      return Array.isArray(list) && list.every(item => typeof item === 'string');
    }) && Array.isArray(records.closet) && records.closet.every(item =>
      !!item && ['id', 'name', 'category', 'color'].every(key => typeof item[key as keyof typeof item] === 'string'))
      && Array.isArray(records.outfits) && records.outfits.every(item =>
        !!item && typeof item.name === 'string' && Array.isArray(item.itemIds) && item.itemIds.every(id => typeof id === 'string'));
  } else if (field === 'saved_memory') {
    const memory = value as Preferences['saved_memory'] | null;
    valid = !!memory && typeof memory.style === 'string' && memory.style.length <= 120
      && typeof memory.size === 'string' && memory.size.length <= 20
      && typeof memory.budget === 'string' && memory.budget.length <= 20
      && (!memory.budget || (/^\d+(\.\d{1,2})?$/.test(memory.budget) && Number(memory.budget) > 0));
  } else valid = typeof value === 'boolean';
  if (!valid) throw new Error('The preference value is invalid.');
}

export async function loadPreference<K extends keyof Preferences>(field: K): Promise<Preferences[K]> {
  const id = await getUserId();
  const { data, error } = await supabase.from('privacy_settings')
    .select(field).eq('user_id', id).maybeSingle();
  if (error) throw error;
  const record = data as Record<string, unknown> | null;
  const value = record?.[field] ?? defaults[field];
  validatePreference(field, value);
  return value;
}

export async function savePreference<K extends keyof Preferences>(field: K, value: Preferences[K]): Promise<void> {
  validatePreference(field, value);
  const id = await getUserId();
  // Create a default row only if absent; never overwrite another setting.
  const created = await supabase.from('privacy_settings')
    .upsert({ user_id: id }, { onConflict: 'user_id', ignoreDuplicates: true });
  if (created.error) throw created.error;
  const patch = field === 'ai_training_consent'
    ? { [field]: value, ai_training_consent_updated_at: new Date().toISOString() }
    : { [field]: value };
  const { error } = await supabase.from('privacy_settings').update(patch)
    .eq('user_id', id).select('user_id').single();
  if (error) throw error;
}

export function usePrivacyPreference<K extends keyof Preferences>(field: K, initial: Preferences[K]) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<'loading' | 'ready' | 'saving' | 'error'>('loading');
  const [message, setMessage] = useState('Loading saved preference...');
  const [attempt, setAttempt] = useState(0);
  const saving = useRef(false);
  useEffect(() => {
    let active = true;
    setState('loading');
    setMessage('Loading saved preference...');
    const timeout = setTimeout(() => {
      if (!active) return;
      active = false;
      setState('error');
      setMessage('Connection timed out. Please retry.');
    }, 20000);
    void loadPreference(field).then(saved => {
      if (!active) return;
      setValue(saved); setState('ready'); setMessage('Saved preference loaded.');
    }).catch(error => {
      if (!active) return;
      setState('error'); setMessage(visibilityError(error));
    }).finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); };
  }, [field, attempt]);

  async function save(next: Preferences[K]) {
    if (state !== 'ready' || saving.current) return false;
    saving.current = true;
    setState('saving'); setMessage('Saving...');
    try {
      await savePreference(field, next);
      setValue(next); setMessage('Preference saved.');
      return true;
    } catch (error) {
      setMessage(`Not saved. ${visibilityError(error)} Refresh to confirm the current saved value.`);
      return false;
    } finally { saving.current = false; setState('ready'); }
  }
  return { value, save, state, message, retry: () => setAttempt(current => current + 1) };
}
