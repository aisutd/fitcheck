import AvatarModel from '../features/avatar/AvatarFigure';
import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber/native';
import { StatusBar } from 'expo-status-bar';
import {
  AccessibilityInfo,
  ActivityIndicator,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { resolveRenderQuality, renderSettings } = require('../features/avatar/renderQuality');

const SKIN_TONES = [
  { id: 'deep', label: 'Deep', color: '#70432F' },
  { id: 'tan', label: 'Tan', color: '#A56F4C' },
  { id: 'medium', label: 'Medium', color: '#C58F69' },
  { id: 'light', label: 'Light', color: '#E0B997' },
];
const HAIR_STYLES = [
  { id: 'short', label: 'Short' },
  { id: 'curly', label: 'Curly' },
  { id: 'long', label: 'Long' },
];
const HAIR_COLORS = [
  { id: 'dark', label: 'Dark', color: '#292522' },
  { id: 'brown', label: 'Brown', color: '#694632' },
  { id: 'copper', label: 'Copper', color: '#A95635' },
];
const BODY_FRAMES = [
  { id: 'petite', label: 'Petite' },
  { id: 'average', label: 'Average' },
  { id: 'tall', label: 'Tall' },
];
const OUTFIT_COLORS = [
  { id: 'forest', label: 'Forest', color: '#315A48' },
  { id: 'terracotta', label: 'Terracotta', color: '#B55F49' },
  { id: 'blue', label: 'Blue', color: '#476F91' },
  { id: 'plum', label: 'Plum', color: '#79556F' },
];

const CAMERA_DISTANCE = { min: 3.7, max: 6, initial: 4.8, step: 0.35 };


function CameraDistance({ distance }) {
  const { camera, invalidate } = useThree();
  useEffect(() => {
    camera.position.set(0, 0.12, distance);
    camera.lookAt(0, 0.12, 0);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, distance, invalidate]);
  return null;
}

class AvatarRenderBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function ChoiceChip({ item, selected, disabled = false, onPress }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={selected ? `${item.label}, selected` : item.label}
      accessibilityState={{ checked: selected, selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.choiceChip,
        selected && styles.choiceChipSelected,
        disabled && styles.choiceChipDisabled,
      ]}
    >
      {item.color ? (
        <View accessibilityElementsHidden style={[styles.swatch, { backgroundColor: item.color }]} />
      ) : null}
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
        {item.label}
      </Text>
    </Pressable>
  );
}

function CameraButton({ label, hint, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.cameraButton, pressed && styles.cameraButtonPressed]}
    >
      <Text style={styles.cameraButtonText}>{label}</Text>
    </Pressable>
  );
}

export default function AvatarStudioScreen({
  customization,
  storageError = '',
  onCustomizationChange,
  onClose,
}) {
  const [yaw, setYaw] = useState(0);
  const [distance, setDistance] = useState(CAMERA_DISTANCE.initial);
  const [renderAttempt, setRenderAttempt] = useState(0);
  const [rendererReady, setRendererReady] = useState(false);
  const [renderError, setRenderError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [qualityMode, setQualityMode] = useState('auto');
  const [quality, setQuality] = useState('low');
  const [reduceMotion, setReduceMotion] = useState(true);
  const [startedAt] = useState(() => Date.now());
  const renderStarted = useRef(startedAt);
  const graphicsLimit = useRef(0);
  const settings = renderSettings(quality);
  const yawRef = useRef(yaw);
  const gestureStartYaw = useRef(0);

  useEffect(() => {
    yawRef.current = yaw;
  }, [yaw]);

  useEffect(() => {
    if (rendererReady || renderError) return undefined;
    const timeout = setTimeout(() => {
      setRenderError('The 3D view is taking too long to initialize. Check device graphics support and try again.');
    }, 15000);
    return () => clearTimeout(timeout);
  }, [renderAttempt, rendererReady, renderError]);

  // Refs below are read only by native gesture callbacks, never during render.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 3,
    onPanResponderGrant: () => {
      gestureStartYaw.current = yawRef.current;
    },
    onPanResponderMove: (_, gesture) => {
      setYaw(gestureStartYaw.current + gesture.dx * 0.012);
    },
  }));

  useEffect(() => {
    let active = true;
    let eventReceived = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      eventReceived = true;
      if (active) setReduceMotion(enabled);
    });
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active && !eventReceived) setReduceMotion(enabled);
    }).catch(() => {});
    return () => { active = false; subscription.remove(); };
  }, []);

  function changeQuality(mode) {
    setQualityMode(mode);
    setQuality(resolveRenderQuality(mode, graphicsLimit.current));
  }

  async function updateCustomization(key, value) {
    const nextCustomization = { ...customization, [key]: value };
    setSaving(true);
    setSaveError('');
    try {
      await onCustomizationChange(nextCustomization);
    } catch (error) {
      setSaveError(`Could not save this avatar change: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  function zoomBy(amount) {
    setDistance((current) =>
      Math.max(CAMERA_DISTANCE.min, Math.min(CAMERA_DISTANCE.max, current + amount)),
    );
  }

  function rotateBy(amount) {
    setYaw((current) => current + amount);
  }

  function retryRenderer() {
    renderStarted.current = Date.now();
    setQuality('low');
    setRendererReady(false);
    setRenderError('');
    setRenderAttempt((current) => current + 1);
  }

  const rendererFallback = (
    <View style={styles.rendererError}>
      <Text style={styles.rendererErrorTitle}>3D preview unavailable</Text>
      <Text style={styles.rendererErrorCopy}>{renderError || 'The graphics renderer could not start on this device.'}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={retryRenderer}
        style={styles.retryButton}
      >
        <Text style={styles.retryButtonText}>Retry 3D preview</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View>
              <Text style={styles.eyebrow}>FITCHECK · AVATAR STUDIO</Text>
              <Text style={styles.title}>Make it yours.</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue to outfit suggestions"
              onPress={onClose}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>See outfits</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Make this avatar yours, or continue to outfits. Use the buttons below to adjust the view.
          </Text>
          <Text style={styles.rendererLabel}>INTERACTIVE 3D · LOCALLY GENERATED MODEL</Text>

          <View
            accessibilityRole="image"
            accessibilityLabel="Stylized interactive 3D avatar. Use the controls below to rotate, zoom, and change the view."
            style={styles.stage}
          >
            {renderError ? (
              rendererFallback
            ) : (
              <>
                <AvatarRenderBoundary
                  key={renderAttempt}
                  onError={(error) => {
                    setRenderError(`The 3D renderer reported an error: ${error.message}`);
                  }}
                  fallback={rendererFallback}
                >
                  <View style={styles.canvas} {...(reduceMotion ? {} : panResponder.panHandlers)}>
                    <Canvas
                      camera={{ position: [0, 0.12, CAMERA_DISTANCE.initial], fov: 34 }}
                      dpr={settings.dpr}
                      frameloop="demand"
                      gl={{ antialias: false, powerPreference: 'low-power' }}
                      onCreated={({ gl }) => {
                        graphicsLimit.current = gl.capabilities.maxTextureSize;
                        setQuality(resolveRenderQuality(qualityMode, gl.capabilities.maxTextureSize, Date.now() - renderStarted.current));
                        gl.setClearColor('#E8EDE6', 1);
                        setRendererReady(true);
                      }}
                      style={styles.canvasElement}
                    >
                      <CameraDistance distance={distance} />
                      <ambientLight intensity={1.8} />
                      <directionalLight position={[3, 4, 5]} intensity={2.2} />
                      <AvatarModel customization={customization} yaw={yaw} segments={settings.segments} />
                    </Canvas>
                  </View>
                </AvatarRenderBoundary>
                {!rendererReady ? (
                  <View pointerEvents="none" style={styles.loadingOverlay}>
                    <ActivityIndicator color="#27483C" />
                    <Text style={styles.loadingText}>Preparing your 3D avatar…</Text>
                  </View>
                ) : null}
              </>
            )}
          </View>

          <Text style={styles.controlLabel}>PREVIEW QUALITY</Text>
          <View style={styles.choiceList}>
            {[{ id: 'auto', label: 'Auto' }, { id: 'low', label: 'Low' }, { id: 'standard', label: 'Standard' }].map((item) => (
              <ChoiceChip key={item.id} item={item} selected={qualityMode === item.id} onPress={() => changeQuality(item.id)} />
            ))}
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.saveStatus}>
            {quality === 'low' ? 'Lightweight preview' : 'Standard preview'}
            {reduceMotion ? ' · Reduced motion: use the view buttons.' : ' · Drag or use the view buttons.'}
          </Text>

          <View style={styles.cameraControls}>
            <CameraButton label="Rotate left" hint="Turn the avatar 45 degrees left" onPress={() => rotateBy(-Math.PI / 4)} />
            <CameraButton label="Rotate right" hint="Turn the avatar 45 degrees right" onPress={() => rotateBy(Math.PI / 4)} />
            <CameraButton label="Zoom in" hint="Move the camera closer" onPress={() => zoomBy(-CAMERA_DISTANCE.step)} />
            <CameraButton label="Zoom out" hint="Move the camera farther away" onPress={() => zoomBy(CAMERA_DISTANCE.step)} />
          </View>
          <View style={styles.cameraControls}>
            <CameraButton label="Front view" hint="Show the avatar from the front" onPress={() => setYaw(0)} />
            <CameraButton label="Side view" hint="Show the avatar from the side" onPress={() => setYaw(Math.PI / 2)} />
            <CameraButton label="Back view" hint="Show the avatar from behind" onPress={() => setYaw(Math.PI)} />
            <CameraButton label="Reset view" hint="Restore the front view and default zoom" onPress={() => {
              setYaw(0);
              setDistance(CAMERA_DISTANCE.initial);
            }} />
          </View>

          {storageError || saveError ? (
            <View accessibilityRole="alert" style={styles.errorNotice}>
              <Text style={styles.errorText}>{saveError || storageError}</Text>
            </View>
          ) : null}
          <Text accessibilityLiveRegion="polite" style={styles.saveStatus}>
            {saving ? 'Saving avatar locally…' : 'Avatar settings are saved on this device.'}
          </Text>

          <View style={styles.customizationCard}>
            <Text style={styles.sectionTitle}>CUSTOMIZE YOUR AVATAR</Text>
            <Text style={styles.controlLabel}>SKIN TONE</Text>
            <View style={styles.choiceList}>
              {SKIN_TONES.map((item) => (
                <ChoiceChip
                  key={item.id}
                  item={item}
                  selected={customization.skinTone === item.id}
                  disabled={saving}
                  onPress={() => updateCustomization('skinTone', item.id)}
                />
              ))}
            </View>
            <Text style={styles.controlLabel}>HAIR STYLE</Text>
            <View style={styles.choiceList}>
              {HAIR_STYLES.map((item) => (
                <ChoiceChip
                  key={item.id}
                  item={item}
                  selected={customization.hairStyle === item.id}
                  disabled={saving}
                  onPress={() => updateCustomization('hairStyle', item.id)}
                />
              ))}
            </View>
            <Text style={styles.controlLabel}>HAIR COLOR</Text>
            <View style={styles.choiceList}>
              {HAIR_COLORS.map((item) => (
                <ChoiceChip
                  key={item.id}
                  item={item}
                  selected={customization.hairColor === item.id}
                  disabled={saving}
                  onPress={() => updateCustomization('hairColor', item.id)}
                />
              ))}
            </View>
            <Text style={styles.controlLabel}>BODY FRAME</Text>
            <View style={styles.choiceList}>
              {BODY_FRAMES.map((item) => (
                <ChoiceChip
                  key={item.id}
                  item={item}
                  selected={customization.bodyFrame === item.id}
                  disabled={saving}
                  onPress={() => updateCustomization('bodyFrame', item.id)}
                />
              ))}
            </View>
            <Text style={styles.controlLabel}>TOP COLOR</Text>
            <View style={styles.choiceList}>
              {OUTFIT_COLORS.map((item) => (
                <ChoiceChip
                  key={item.id}
                  item={item}
                  selected={customization.outfitColor === item.id}
                  disabled={saving}
                  onPress={() => updateCustomization('outfitColor', item.id)}
                />
              ))}
            </View>
          </View>

          <Text style={styles.disclaimer}>
            This is a stylized avatar, not a body scan or exact fit simulation. Its basic outfit is illustrative and does not represent specific wardrobe items.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F4EF' },
  scrollContent: { flexGrow: 1, paddingBottom: 28 },
  content: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 22 },
  topBar: {
    minHeight: 78,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#DCE3DC',
  },
  eyebrow: { color: '#627A68', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  title: { marginTop: 5, color: '#202B27', fontFamily: 'serif', fontSize: 29, fontWeight: '600' },
  closeButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#DCE3DC',
    borderRadius: 8,
    backgroundColor: '#FAFBF8',
  },
  closeButtonText: { color: '#27483C', fontSize: 12, fontWeight: '800' },
  subtitle: { marginTop: 15, color: '#6C7771', fontSize: 13, lineHeight: 19 },
  rendererLabel: { marginTop: 17, marginBottom: 8, color: '#202B27', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  stage: {
    height: 330,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DCE3DC',
    borderRadius: 10,
    backgroundColor: '#E8EDE6',
  },
  canvas: { flex: 1 },
  canvasElement: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#E8EDE6',
  },
  loadingText: { color: '#6C7771', fontSize: 12, fontWeight: '600' },
  rendererError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  rendererErrorTitle: { color: '#202B27', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  rendererErrorCopy: { marginTop: 9, color: '#6C7771', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#27483C',
  },
  retryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  cameraControls: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  cameraButton: {
    minHeight: 44,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: '#DCE3DC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  cameraButtonPressed: { backgroundColor: '#E7EDE6' },
  cameraButtonText: { color: '#27483C', fontSize: 10, fontWeight: '800' },
  errorNotice: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: '#F9E8E4' },
  errorText: { color: '#9B3F35', fontSize: 12, lineHeight: 17 },
  saveStatus: { marginTop: 11, color: '#6C7771', fontSize: 11 },
  customizationCard: {
    gap: 10,
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCE3DC',
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  sectionTitle: { color: '#202B27', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  controlLabel: { marginTop: 5, color: '#6C7771', fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  choiceList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  choiceChip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: '#DCE3DC',
    borderRadius: 22,
    backgroundColor: '#FAFBF8',
  },
  choiceChipSelected: { borderColor: '#27483C', backgroundColor: '#27483C' },
  choiceChipDisabled: { opacity: 0.65 },
  choiceText: { color: '#202B27', fontSize: 10, fontWeight: '700' },
  choiceTextSelected: { color: '#FFFFFF' },
  swatch: { width: 13, height: 13, borderRadius: 7, borderWidth: 1, borderColor: '#00000020' },
  disclaimer: { marginTop: 14, color: '#6C7771', fontSize: 10, lineHeight: 16 },
});
