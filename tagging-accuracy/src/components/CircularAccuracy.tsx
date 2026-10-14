import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import { colors } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SIZE = 210;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type CircularAccuracyProps = { value: number };

export function CircularAccuracy({ value }: CircularAccuracyProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  const progress = useRef(new Animated.Value(0)).current;
  const [label, setLabel] = useState(0);

  useEffect(() => {
    progress.setValue(0);
    const listener = progress.addListener(({ value: next }) => setLabel(Math.round(next)));
    Animated.timing(progress, {
      toValue: safeValue,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => progress.removeListener(listener);
  }, [progress, safeValue]);

  const dashOffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View
      accessibilityLabel={`${safeValue}% overall accuracy`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: safeValue }}
      style={styles.wrap}
    >
      <View style={styles.outerGlow} />
      <Svg height={SIZE} width={SIZE} style={styles.svg}>
        <Defs>
          <SvgGradient id="accuracyRing" x1="0" x2="1" y1="0" y2="1">
            <Stop offset="0" stopColor={colors.electric} />
            <Stop offset="0.48" stopColor={colors.lavender} />
            <Stop offset="1" stopColor="#8C62FF" />
          </SvgGradient>
        </Defs>
        <Circle cx={SIZE / 2} cy={SIZE / 2} fill="none" r={RADIUS} stroke="#2B274A" strokeWidth={STROKE} />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          fill="none"
          origin={`${SIZE / 2}, ${SIZE / 2}`}
          r={RADIUS}
          rotation="-90"
          stroke="url(#accuracyRing)"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset as unknown as number}
          strokeLinecap="round"
          strokeWidth={STROKE}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.microLabel}>AI SCORE</Text>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{label}</Text>
          <Text style={styles.percent}>%</Text>
        </View>
        <Text style={styles.status}>high confidence</Text>
      </View>
      <View style={styles.sparkOne} />
      <View style={styles.sparkTwo} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  outerGlow: {
    position: 'absolute', width: 170, height: 170, borderRadius: 85,
    backgroundColor: 'rgba(138, 104, 255, 0.18)', shadowColor: colors.lavender,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.75, shadowRadius: 28, elevation: 8,
  },
  svg: { position: 'absolute' },
  center: { alignItems: 'center' },
  microLabel: { color: '#A9A3C4', fontSize: 9, fontWeight: '800', letterSpacing: 1.8 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-start' },
  value: {
    color: colors.surface, fontSize: 57, fontWeight: '900', letterSpacing: -3,
    lineHeight: 66, fontVariant: ['tabular-nums'],
  },
  percent: { marginTop: 10, marginLeft: 3, color: colors.electric, fontSize: 20, fontWeight: '900' },
  status: { marginTop: -3, color: colors.lavender, fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  sparkOne: {
    position: 'absolute', top: 25, right: 30, width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.electric, shadowColor: colors.electric, shadowOpacity: 1, shadowRadius: 7,
  },
  sparkTwo: {
    position: 'absolute', bottom: 31, left: 24, width: 4, height: 4, borderRadius: 2,
    backgroundColor: colors.lavender, shadowColor: colors.lavender, shadowOpacity: 1, shadowRadius: 6,
  },
});
