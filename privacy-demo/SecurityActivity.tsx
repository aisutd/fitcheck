import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { activityApiUrl } from './lib/activityConfig';
import { getUserId, visibilityError } from './lib/closetVisibility';
import { supabase } from './lib/supabase';

type Activity = { requests_last_5_minutes: number; alerts: { window: string; requests: number }[] };

export function SecurityActivity() {
  const [activity, setActivity] = useState<Activity | null>(null);
  const [message, setMessage] = useState('Checking recent account activity...');
  const [busy, setBusy] = useState(false);

  async function refresh() {
    if (!activityApiUrl) { setMessage('Account activity monitoring is not configured for this build.'); return; }
    try {
      await getUserId();
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!data.session) throw new Error('Your session is not ready.');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(`${activityApiUrl}/security/activity`, {
          headers: { Authorization: `Bearer ${data.session.access_token}` }, signal: controller.signal,
        });
        if (!response.ok) throw new Error('Could not check account activity.');
        setActivity(await response.json());
        setMessage('Activity check updated.');
      } finally { clearTimeout(timer); }
    } catch (error) { setMessage(`Activity check unavailable. ${visibilityError(error)}`); }
  }

  useEffect(() => { void refresh(); }, []);

  async function testBurst() {
    if (busy) return;
    setBusy(true);
    setMessage('Running a test burst of read-only requests...');
    try {
      const userId = await getUserId();
      // Genuine requests through the gateway, not client-supplied activity logs.
      for (let batch = 0; batch < 8; batch++) {
        await Promise.all(Array.from({ length: 10 }, async () => {
          const { error } = await supabase.from('privacy_settings').select('user_id').eq('user_id', userId).limit(1);
          if (error) throw error;
        }));
      }
      await refresh();
    } catch (error) { setMessage(`Burst test failed. ${visibilityError(error)}`); }
    finally { setBusy(false); }
  }

  return <View style={{ backgroundColor: 'white', borderRadius: 22, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: '#EEE9F6' }}>
    <Text style={{ fontSize: 16, fontWeight: '700', color: '#29233F' }}>Account activity</Text>
    <Text accessibilityLiveRegion="polite" style={{ marginTop: 10, color: '#534FA5' }}>{message}</Text>
    {activity && <>
      <Text style={{ marginTop: 10 }}>{activity.requests_last_5_minutes} monitored requests in the last 5 minutes.</Text>
      <Text style={{ marginTop: 8 }}>{activity.alerts.length ? `${activity.alerts.length} activity windows flagged for review.` : 'No unusual activity flags recorded.'}</Text>
      {activity.alerts.map(alert => <Text key={alert.window} style={{ marginTop: 8, color: '#534FA5' }}>{new Date(alert.window).toLocaleString()}: {alert.requests} requests</Text>)}
    </>}
    <Text style={{ marginTop: 12, fontSize: 11, color: '#837C96' }}>This demo monitors privacy settings requests. Its model was trained on simulated traffic; a flag does not prove fraud.</Text>
    <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void refresh(); }} style={{ paddingVertical: 12 }}><Text style={{ color: '#36009C', fontWeight: '600' }}>Check activity</Text></Pressable>
    {__DEV__ && activityApiUrl && <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void testBurst(); }} style={{ paddingVertical: 12 }}><Text style={{ color: '#36009C', fontWeight: '600' }}>{busy ? 'Testing...' : 'Test request burst (development)'}</Text></Pressable>}
  </View>;
}
