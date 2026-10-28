import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AvatarModel from './AvatarFigure';
import { quizAvatarPreview } from '../quiz/quizAvatarPreview';

class PreviewBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export default function QuizAvatarPreview({ answers, questionId, customization }) {
  const clothing = quizAvatarPreview(answers, questionId);
  const [yaw, setYaw] = useState(0);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (ready || failed) return undefined;
    const timer = setTimeout(() => setFailed(true), 12000);
    return () => clearTimeout(timer);
  }, [ready, failed, attempt]);
  const fallback = <View style={styles.fallback}><Text style={styles.copy}>3D preview unavailable. Your selections still work.</Text></View>;
  return <View style={styles.card}>
    <Text style={styles.eyebrow}>YOUR CHOICE, IN VIEW</Text>
    <View accessibilityRole="image" accessibilityLabel={`Illustrative avatar preview: ${clothing.label}`} style={styles.stage}>
      {failed ? fallback : <PreviewBoundary key={attempt} onError={() => setFailed(true)} fallback={fallback}>
        <Canvas dpr={1} frameloop="demand" camera={{ position: [0, 0.1, 5.1], fov: 34 }} gl={{ antialias: false, powerPreference: 'low-power' }}
          onCreated={({ gl }) => { gl.setClearColor('#E8EDE6', 1); setReady(true); }}>
          <ambientLight intensity={1.8} />
          <directionalLight position={[3, 4, 5]} intensity={2.2} />
          <AvatarModel customization={customization} yaw={yaw} segments={10} clothing={clothing} />
        </Canvas>
      </PreviewBoundary>}
    </View>
    <Text accessibilityLiveRegion="polite" style={styles.caption}>{clothing.label}</Text>
    <View style={styles.controls}>
      {failed ? <Pressable accessibilityRole="button" style={styles.button} onPress={() => { setFailed(false); setReady(false); setAttempt((value) => value + 1); }}><Text style={styles.buttonText}>Retry preview</Text></Pressable> : <>
        <Pressable accessibilityRole="button" accessibilityLabel="Turn avatar left" style={styles.button} onPress={() => setYaw((value) => value - Math.PI / 4)}><Text style={styles.buttonText}>← Turn</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Turn avatar right" style={styles.button} onPress={() => setYaw((value) => value + Math.PI / 4)}><Text style={styles.buttonText}>Turn →</Text></Pressable>
      </>}
    </View>
    <Text style={styles.copy}>Illustration of your most recent outfit choice. All selected answers stay saved. Product photos and exact garment fitting are separate.</Text>
  </View>;
}
const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, borderColor: '#DCE3DC', backgroundColor: '#FAFBF8', padding: 12, marginVertical: 14 },
  eyebrow: { color: '#627A68', letterSpacing: 1.2, fontSize: 9, fontWeight: '800', marginBottom: 10 },
  stage: { height: 240, overflow: 'hidden', borderRadius: 8, backgroundColor: '#E8EDE6' },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  caption: { color: '#27483C', fontSize: 13, fontWeight: '700', marginTop: 10 },
  controls: { flexDirection: 'row', gap: 10, marginVertical: 8 },
  button: { minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#DCE3DC' },
  buttonText: { color: '#27483C', fontSize: 12, fontWeight: '700' },
  copy: { color: '#6C7771', fontSize: 11, lineHeight: 17 },
});
