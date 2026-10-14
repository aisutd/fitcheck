import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { AccuracyMetric } from '../types/accuracy';

type MiniBarChartProps = {
  metrics: AccuracyMetric[];
  lowAccuracyThreshold: number;
};

export function MiniBarChart({ metrics, lowAccuracyThreshold }: MiniBarChartProps) {
  return (
    <View style={styles.chart} accessible accessibilityLabel="Accuracy comparison bar chart">
      {metrics.map((metric) => {
        const isLow = metric.accuracy < lowAccuracyThreshold;
        return (
          <View key={metric.id} style={styles.column}>
            <Text style={[styles.value, isLow && styles.lowText]}>{metric.accuracy}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max(metric.accuracy, 8)}%`,
                    backgroundColor: isLow ? colors.amber : colors.green,
                  },
                ]}
              />
            </View>
            <Text numberOfLines={1} style={styles.label}>
              {metric.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    height: 130,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingTop: 8,
  },
  column: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
  },
  value: {
    marginBottom: 5,
    color: colors.green,
    fontSize: 10,
    fontWeight: '800',
  },
  lowText: {
    color: colors.amber,
  },
  barTrack: {
    flex: 1,
    width: '72%',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRadius: 6,
    backgroundColor: colors.track,
  },
  bar: {
    width: '100%',
    borderRadius: 6,
  },
  label: {
    width: '100%',
    marginTop: 6,
    color: colors.muted,
    fontSize: 9,
    textAlign: 'center',
  },
});
