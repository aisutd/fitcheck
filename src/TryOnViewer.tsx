import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, PanResponder, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import * as THREE from 'three';
import { loadDemoAvatar } from './loadDemoAvatar';
import { clampZoom, fitDistance, nearestAngle } from './viewerMath';

const C = { ivory: '#FBF7F0', tea: '#E9DCCB', cream: '#E9DFF0', lavender: '#B9A4C9', plum: '#5A4C60' };
function Control({ label, glyph, onPress, selected = false, disabled = false }: { label: string; glyph?: string; onPress: () => void; selected?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress} style={[s.control, selected && { backgroundColor: C.cream }, disabled && { opacity: .4 }]}><Text style={[s.controlText, glyph ? { fontSize: 22 } : null]}>{glyph ?? label}</Text></Pressable>;
}
function disposeScene(scene: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
  scene.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    geometries.add(mesh.geometry);
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  textures.forEach(texture => texture.dispose()); materials.forEach(material => material.dispose()); geometries.forEach(geometry => geometry.dispose());
}
export default function TryOnViewer() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [modelError, setModelError] = useState('');
  const [preset, setPreset] = useState<string | null>('Front');
  const [attempt, setAttempt] = useState(0);
  const state = useRef({ angle: 0, targetAngle: 0, zoom: 1, targetZoom: 1 });
  const alive = useRef(true), focused = useRef(true), foreground = useRef(true);
  const cleanup = useRef<(() => void) | null>(null);
  const layout = useRef({ width: 1, height: 1 });
  const gesture = useRef({ x: 0, distance: 0, count: 0 });
  useEffect(() => {
    alive.current = true;
    const subscription = AppState.addEventListener('change', value => { foreground.current = value === 'active'; });
    return () => { alive.current = false; cleanup.current?.(); subscription.remove(); };
  }, []);
  useFocusEffect(useCallback(() => { focused.current = true; return () => { focused.current = false; }; }, []));
  // PanResponder stores callbacks; these refs are read only when gestures fire.
  // eslint-disable-next-line react-hooks/refs
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: event => {
      gesture.current = { x: event.nativeEvent.touches[0]?.pageX ?? 0, distance: 0, count: 0 };
      state.current.targetAngle = state.current.angle;
      state.current.targetZoom = state.current.zoom;
      setPreset(null);
    },
    onPanResponderMove: event => {
      const touches = event.nativeEvent.touches;
      const previous = gesture.current;
      if (touches.length >= 2) {
        const distance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
        if (previous.count === 2 && previous.distance > 0) state.current.targetZoom = clampZoom(state.current.targetZoom * distance / previous.distance);
        gesture.current = { x: touches[0].pageX, distance, count: 2 };
      } else if (touches.length === 1) {
        if (previous.count === 1) state.current.targetAngle += (touches[0].pageX - previous.x) / Math.max(layout.current.width, 1) * Math.PI * 2;
        gesture.current = { x: touches[0].pageX, distance: 0, count: 1 };
      }
    },
    onPanResponderRelease: () => { gesture.current.count = 0; },
    onPanResponderTerminate: () => { gesture.current.count = 0; },
  }), []);
  function selectPreset(name: string, angle: number) { state.current.targetAngle = nearestAngle(state.current.angle, angle); setPreset(name); }
  function reset() { selectPreset('Front', 0); state.current.targetZoom = 1; }
  async function initialize(gl: ExpoWebGLRenderingContext) {
    cleanup.current?.();
    let disposed = false, frame = 0;
    const scene = new THREE.Scene();
    let renderer: THREE.WebGLRenderer | null = null;
    const stop = () => { disposed = true; cancelAnimationFrame(frame); disposeScene(scene); renderer?.dispose(); };
    cleanup.current = stop;
    try {
      setStatus('loading');
      const canvas = Platform.OS === 'web' ? gl.canvas : { width: gl.drawingBufferWidth, height: gl.drawingBufferHeight, style: {}, addEventListener() {}, removeEventListener() {}, setAttribute() {} };
      renderer = new THREE.WebGLRenderer({ context: gl as unknown as WebGLRenderingContext, canvas: canvas as HTMLCanvasElement, antialias: true });
      renderer.setPixelRatio(1);
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      scene.background = new THREE.Color('#EDE5E0');
      scene.add(new THREE.HemisphereLight('#FFF8EE', '#A497AF', 2.3));
      const light = new THREE.DirectionalLight('#FFF5E6', 3);
      light.position.set(3, 5, 4); light.castShadow = true;
      light.shadow.mapSize.set(1024, 1024); light.shadow.camera.left = -3; light.shadow.camera.right = 3;
      light.shadow.camera.top = 3; light.shadow.camera.bottom = -3; light.shadow.normalBias = .035;
      scene.add(light);
      const fill = new THREE.DirectionalLight('#E9DFF0', 1.4); fill.position.set(-3, 2, -2); scene.add(fill);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: '#E9DCCB', roughness: 1 }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -.012; floor.receiveShadow = true; scene.add(floor);
      const avatar = await loadDemoAvatar();
      if (disposed || !alive.current) { disposeScene(avatar); return; }
      const bounds = new THREE.Box3().setFromObject(avatar);
      const size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
      if (size.y <= 0 || !Number.isFinite(size.y)) throw new Error('Empty model');
      avatar.position.x -= center.x; avatar.position.z -= center.z; avatar.position.y -= bounds.min.y;
      const pivot = new THREE.Group(); pivot.add(avatar); scene.add(pivot);
      avatar.traverse(object => { if ((object as THREE.Mesh).isMesh) { object.castShadow = true; object.receiveShadow = true; } });
      const camera = new THREE.PerspectiveCamera(32, gl.drawingBufferWidth / gl.drawingBufferHeight, .05, 100);
      let lastTime = 0;
      setStatus('ready');
      const render = (time: number) => {
        if (disposed) return;
        frame = requestAnimationFrame(render);
        if (!focused.current || !foreground.current) { lastTime = time; return; }
        try {
          const dt = lastTime ? Math.min((time - lastTime) / 1000, .1) : 1 / 60; lastTime = time;
          const smoothing = 1 - Math.exp(-12 * dt);
          const view = state.current;
          view.angle += (view.targetAngle - view.angle) * smoothing;
          view.zoom += (view.targetZoom - view.zoom) * smoothing;
          pivot.rotation.y = view.angle;
          const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
          camera.aspect = w / h; camera.updateProjectionMatrix(); renderer!.setSize(w, h, false);
          // Fit height and the rotation-safe horizontal diameter, with bounded zoom.
          const distance = fitDistance(size.y, Math.hypot(size.x, size.z), camera.aspect) / view.zoom;
          camera.position.set(0, size.y * .51, Math.max(distance, size.z * 2 + .5));
          camera.lookAt(0, size.y * .51, 0);
          renderer!.render(scene, camera); gl.endFrameEXP();
        } catch { stop(); if (alive.current) { setStatus('error'); setModelError('The 3D renderer could not display the demo. Try reloading the viewer.'); } }
      };
      frame = requestAnimationFrame(render);
    } catch {
      stop(); if (alive.current) { setStatus('error'); setModelError('The bundled demo avatar could not be loaded. Try again on a supported Expo Go device.'); }
    }
  }
  const back = () => router.canGoBack() ? router.back() : router.replace('/');
  return <SafeAreaView style={s.screen}>
    <View style={s.header}><Control label="Back to uploads" glyph="‹" onPress={back} /><Text style={s.title}>Your Try-On</Text><View style={{ width: 44 }} /></View>
    <View style={s.demo}><Text style={s.demoText}>DEMO AVATAR</Text><Text style={s.disclosure}>A fixed model and outfit. Your photos are not used.</Text></View>
    <View style={s.viewport} onLayout={event => { layout.current = event.nativeEvent.layout; }}>
      <GLView key={attempt} style={StyleSheet.absoluteFill} onContextCreate={initialize} />
      <View style={StyleSheet.absoluteFill} {...pan.panHandlers} accessibilityLabel="3D demo avatar. Drag to rotate, pinch to zoom." />
      <View style={s.leftControls}>{[['Front', 0], ['Side', Math.PI / 2], ['Back', Math.PI]].map(([name, angle]) => <Control key={name} label={name as string} selected={preset === name} disabled={status !== 'ready'} onPress={() => selectPreset(name as string, angle as number)} />)}</View>
      <View style={s.rightControls}><Control label="Zoom in" glyph="+" disabled={status !== 'ready'} onPress={() => { state.current.targetZoom = clampZoom(state.current.targetZoom + .1); }} /><Control label="Zoom out" glyph="−" disabled={status !== 'ready'} onPress={() => { state.current.targetZoom = clampZoom(state.current.targetZoom - .1); }} /><Control label="Reset view" glyph="↺" disabled={status !== 'ready'} onPress={reset} /></View>
      {status === 'loading' && <View pointerEvents="none" style={s.centerOverlay}><ActivityIndicator color={C.plum} /><Text style={s.status}>Loading demo avatar…</Text></View>}
      {status === 'error' && <View style={s.centerOverlay}><Text style={s.status}>{modelError}</Text><Control label="Retry" onPress={() => { setModelError(''); setStatus('loading'); setAttempt(value => value + 1); }} /></View>}
      <Text pointerEvents="none" style={s.instruction}>Drag to rotate • Pinch to zoom</Text>
    </View>
    <View style={s.actions}><Pressable accessibilityRole="button" onPress={back} style={[s.action, { backgroundColor: C.tea }]}><Text style={s.secondaryText}>Try Another</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setMessage('Saving looks is coming soon!')} style={[s.action, { backgroundColor: C.plum }]}><Text style={s.primaryText}>Save Look</Text></Pressable></View>
    {!!message && <Text accessibilityLiveRegion="polite" style={s.saveMessage}>{message}</Text>}
  </SafeAreaView>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ivory }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 12 }, title: { fontSize: 23, color: C.plum, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }, demo: { alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingBottom: 16 }, demoText: { color: C.plum, backgroundColor: C.cream, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5, fontSize: 9, letterSpacing: 1.8 }, disclosure: { fontSize: 11, color: '#756A79', textAlign: 'center' }, viewport: { flex: 1, minHeight: 220, marginHorizontal: 16, backgroundColor: C.tea, borderRadius: 24, overflow: 'hidden' }, leftControls: { position: 'absolute', left: 12, top: '36%', gap: 8 }, rightControls: { position: 'absolute', right: 12, top: '36%', gap: 8 }, control: { minWidth: 44, minHeight: 44, borderRadius: 14, backgroundColor: C.ivory, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9 }, controlText: { color: C.plum, fontSize: 11, fontWeight: '600' }, centerOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 16, paddingHorizontal: 72, backgroundColor: 'rgba(251,247,240,.88)' }, status: { fontSize: 13, color: C.plum, textAlign: 'center', lineHeight: 21 }, instruction: { position: 'absolute', bottom: 18, alignSelf: 'center', fontSize: 11, color: C.plum, backgroundColor: C.ivory, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12 }, actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, width: '100%', maxWidth: 650, alignSelf: 'center' }, action: { flex: 1, minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, secondaryText: { color: C.plum, fontSize: 14, fontWeight: '600' }, primaryText: { color: C.ivory, fontSize: 14, fontWeight: '600' }, saveMessage: { color: C.plum, textAlign: 'center', paddingHorizontal: 20, paddingBottom: 12, fontSize: 12 },
});
