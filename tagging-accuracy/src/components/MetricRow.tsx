import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { AccuracyMetric } from '../types/accuracy';

type MetricRowProps = { metric: AccuracyMetric; lowAccuracyThreshold: number };

export function MetricRow({ metric, lowAccuracyThreshold }: MetricRowProps) {
  const isLow = metric.accuracy < lowAccuracyThreshold;
  const reveal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    reveal.setValue(0);
    Animated.timing(reveal, {
      toValue: metric.accuracy,
      duration: 680,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [metric.accuracy, reveal]);

  const width = reveal.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.container, isLow && styles.lowContainer]}>
      <View style={styles.labelRow}>
        <View style={styles.nameWrap}>
          <View style={[styles.signalDot, isLow && styles.lowSignalDot]} />
          <Text style={styles.name}>{metric.label}</Text>
          {isLow ? (
            <View style={styles.needsWorkBadge}>
              <Text style={styles.needsWorkText}>Watch</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.value, isLow && styles.lowValue]}>{metric.accuracy}%</Text>
      </View>
      <View
        accessibilityLabel={`${metric.accuracy}% accuracy`}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: metric.accuracy }}
        style={styles.signalTrack}
      >
        <Animated.View style={[styles.signalReveal, { width }]}>
          <LinearGradient
            colors={isLow ? ['#FFB08F', '#FF6F91'] : ['#8DE7FF', '#A27CFF']}
            end={{ x: 1, y: 0 }}
            start={{ x: 0, y: 0 }}
            style={styles.signalGradient}
          />
        </Animated.View>
        <View style={[styles.endNode, { left: `${Math.max(3, Math.min(96, metric.accuracy))}%` }]} />
      </View>
      <Text style={styles.sample}>{metric.sampleCount.toLocaleString()} TEST IMAGES</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 7, paddingHorizontal: 12, paddingVertical: 13, borderRadius: 16 },
  lowContainer: { backgroundColor: 'rgba(255, 139, 106, 0.07)' },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  nameWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  signalDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: colors.electric,
    shadowColor: colors.electric, shadowOpacity: 0.9, shadowRadius: 5,
  },
  lowSignalDot: { backgroundColor: colors.amber, shadowColor: colors.amber },
  name: { color: '#F5F2FF', fontSize: 14, fontWeight: '700' },
  value: { color: colors.electric, fontSize: 15, fontVariant: ['tabular-nums'], fontWeight: '900' },
  lowValue: { color: colors.amber },
  needsWorkBadge: {
    borderRadius: 999, backgroundColor: 'rgba(255, 139, 106, 0.13)',
    paddingHorizontal: 7, paddingVertical: 3,
  },
  needsWorkText: { color: colors.amber, fontSize: 8, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  signalTrack: {
    height: 5, justifyContent: 'center', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  signalReveal: { height: 5, overflow: 'hidden', borderRadius: 999 },
  signalGradient: { width: '100%', height: '100%' },
  endNode: {
    position: 'absolute', width: 8, height: 8, marginLeft: -4, borderWidth: 2,
    borderColor: colors.surface, borderRadius: 4, backgroundColor: colors.violet,
  },
  sample: { color: '#77718F', fontSize: 8, fontWeight: '700', letterSpacing: 0.65 },
});
