import { StyleSheet, View } from 'react-native';

import { colors } from '../theme';

type ProgressBarProps = {
  value: number;
  isLow?: boolean;
  height?: number;
};

export function ProgressBar({ value, isLow = false, height = 8 }: ProgressBarProps) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <View
      accessibilityLabel={`${safeValue}% accuracy`}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: safeValue }}
      style={[styles.track, { height }]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${safeValue}%`,
            backgroundColor: isLow ? colors.amber : colors.green,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 999,
    backgroundColor: colors.track,
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
});
