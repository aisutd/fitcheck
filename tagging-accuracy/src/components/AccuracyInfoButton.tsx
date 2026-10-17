import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors } from '../theme';

type AccuracyInfoButtonProps = {
  totalPhotos: number;
  lowAccuracyThreshold?: number;
  style?: StyleProp<ViewStyle>;
  onViewReport?: () => void;
};

export function AccuracyInfoButton({ totalPhotos, lowAccuracyThreshold = 75, style, onViewReport }: AccuracyInfoButtonProps) {
  const [isMounted, setIsMounted] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isMounted) return;
    animation.setValue(0);
    Animated.timing(animation, {
      toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [animation, isMounted]);

  const close = () => {
    Animated.timing(animation, {
      toValue: 0, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true,
    }).start(({ finished }) => finished && setIsMounted(false));
  };

  return (
    <>
      <Pressable
        accessibilityHint="Opens information about clothing recognition accuracy"
        accessibilityLabel="About AI tagging accuracy"
        accessibilityRole="button"
        onPress={() => setIsMounted(true)}
        style={({ pressed }) => [styles.floatingShell, style, pressed && styles.pressed]}
      >
        <LinearGradient colors={['#8DE7FF', '#A37BFF', '#6946EA']} end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.floatingButton}>
          <Text style={styles.infoGlyph}>i</Text>
        </LinearGradient>
      </Pressable>

      <Modal animationType="none" onRequestClose={close} transparent visible={isMounted}>
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.backdrop, { opacity: animation }]}>
            <BlurView experimentalBlurMethod="dimezisBlurView" intensity={28} style={StyleSheet.absoluteFill} tint="dark" />
            <Pressable accessibilityLabel="Close information" onPress={close} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              {
                opacity: animation,
                transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [430, 0] }) }],
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(141,231,255,0.42)', 'rgba(163,123,255,0.6)', 'rgba(255,255,255,0.08)']}
              end={{ x: 1, y: 1 }} start={{ x: 0, y: 0 }} style={styles.glowBorder}
            >
              <View style={styles.sheetInner}>
                <View style={styles.sheetTopRow}>
                  <View style={styles.sparkleMark}><Text style={styles.sparkleText}>✦</Text></View>
                  <Pressable accessibilityLabel="Close" accessibilityRole="button" onPress={close} style={styles.closeCircle}>
                    <Text style={styles.closeText}>×</Text>
                  </Pressable>
                </View>
                <Text style={styles.kicker}>BEHIND THE SCORE</Text>
                <Text style={styles.title}>How accurate is AI tagging?</Text>
                <Text style={styles.body}>
                  Accuracy is the percentage of test photos where FitCheck’s predicted tag matched the human-reviewed answer.
                </Text>
                <LinearGradient colors={['rgba(141,231,255,0.12)', 'rgba(163,123,255,0.14)']} end={{ x: 1, y: 0 }} start={{ x: 0, y: 0 }} style={styles.formula}>
                  <Text style={styles.formulaText}>correct tags</Text><Text style={styles.formulaSymbol}>÷</Text>
                  <Text style={styles.formulaText}>tested photos</Text><Text style={styles.formulaSymbol}>× 100</Text>
                </LinearGradient>
                <Text style={styles.body}>
                  {totalPhotos > 0
                    ? `This report uses ${totalPhotos.toLocaleString()} photos. Results below ${lowAccuracyThreshold}% glow coral so performance gaps stand out. Lighting, image quality, and test-set representation can all affect the score.`
                    : 'No tests have been completed. Accuracy will appear only after predictions are compared with human-reviewed answers across a labeled evaluation set.'}
                </Text>
                <Text style={styles.disclaimer}>AI can make mistakes—review important details before saving.</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => { close(); onViewReport?.(); }}
                  style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                >
                  <LinearGradient colors={['#9B7BFF', '#6A4CE4']} end={{ x: 1, y: 0 }} start={{ x: 0, y: 0 }} style={styles.actionGradient}>
                    <Text style={styles.actionText}>{onViewReport ? 'View full report' : 'Got it'}</Text>
                    <Text style={styles.actionArrow}>→</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingShell: {
    position: 'absolute', right: 18, bottom: 22, zIndex: 20, width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.violet, shadowColor: colors.violet, shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.45, shadowRadius: 15, elevation: 10,
  },
  floatingButton: {
    flex: 1, alignItems: 'center', justifyContent: 'center', margin: 2, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)', borderRadius: 27,
  },
  pressed: { opacity: 0.82, transform: [{ scale: 0.95 }] },
  infoGlyph: { color: colors.surface, fontSize: 23, fontWeight: '900', fontStyle: 'italic' },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9, 8, 28, 0.64)' },
  sheet: { paddingHorizontal: 10, paddingBottom: 10 },
  glowBorder: { borderRadius: 32, padding: 1 },
  sheetInner: { borderRadius: 31, backgroundColor: colors.midnight, paddingHorizontal: 23, paddingTop: 18, paddingBottom: 24 },
  sheetTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sparkleMark: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: 'rgba(141,231,255,0.1)' },
  sparkleText: { color: colors.electric, fontSize: 23 },
  closeCircle: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#373251', borderRadius: 19, backgroundColor: '#201D3B' },
  closeText: { marginTop: -2, color: '#D8D1EE', fontSize: 25, fontWeight: '300' },
  kicker: { color: colors.electric, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title: { marginTop: 7, marginBottom: 10, color: colors.surface, fontSize: 24, fontWeight: '900', letterSpacing: -0.6 },
  body: { color: '#AAA5BD', fontSize: 13, lineHeight: 20 },
  formula: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginVertical: 16, borderWidth: 1, borderColor: 'rgba(174,153,255,0.15)', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 12 },
  formulaText: { color: '#F1EDFF', fontSize: 11, fontWeight: '800' },
  formulaSymbol: { color: colors.lavender, fontSize: 12, fontWeight: '900' },
  disclaimer: { marginTop: 13, color: '#DDD7EE', fontSize: 11, fontWeight: '700', lineHeight: 16 },
  action: { marginTop: 20, borderRadius: 15, overflow: 'hidden' },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 15 },
  actionText: { color: colors.surface, fontSize: 14, fontWeight: '900' },
  actionArrow: { color: colors.surface, fontSize: 18 },
});
