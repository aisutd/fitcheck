import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { demoAccuracyReport } from './src/data/demoAccuracyReport';
import { TaggingAccuracyReportScreen } from './src/screens/TaggingAccuracyReportScreen';

export default function App() {
  return (
    <View style={styles.app}>
      <StatusBar style="dark" />
      <TaggingAccuracyReportScreen report={demoAccuracyReport} />
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: '#F7F5FF',
  },
});
