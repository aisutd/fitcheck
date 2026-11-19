import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { emptyStyleMemory, validStyleMemory } from './styleMemoryModel';
const KEY = '@fitcheck/suggest-memory-v1';
const initial = { data: emptyStyleMemory(), ready: false, error: '' };
let snapshot = initial;
let loading = null;
let queue = Promise.resolve();
const listeners = new Set();
function publish(next) { snapshot = next; listeners.forEach((listener) => listener()); }
function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
function getSnapshot() { return snapshot; }
export async function loadStyleMemory() {
  if (snapshot.ready) return;
  if (loading) return loading;
  loading = (async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const data = raw === null ? emptyStyleMemory() : JSON.parse(raw);
      if (!validStyleMemory(data)) throw new Error('Saved style memory has an invalid format.');
      publish({ data, ready: true, error: '' });
    } catch (error) { publish({ ...snapshot, ready: false, error: error.message }); }
    finally { loading = null; }
  })();
  return loading;
}
export function updateStyleMemory(operation) {
  const result = queue.then(async () => {
    if (!snapshot.ready) throw new Error('Style memory is unavailable. Retry loading before making changes.');
    const data = operation(snapshot.data);
    if (!validStyleMemory(data)) throw new Error('These style memory changes are invalid.');
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
    publish({ data, ready: true, error: '' });
    return data;
  });
  queue = result.catch(() => {});
  return result;
}
export function useStyleMemory() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => initial);
  useEffect(() => { loadStyleMemory(); }, []);
  return state;
}
