import { resolveImageUri } from '../features/collections/photoSource';
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useFitCheck } from '../../App';
import FeaturePage, { ui } from '../components/FeaturePage';
import { TaggingAccuracyReportScreen } from '../features/analysis/screens/TaggingAccuracyReportScreen';
import { emptyAccuracyReport } from '../features/analysis/data/emptyAccuracyReport';
export default function AnalysisRoute() {
 const { items = '' } = useLocalSearchParams(); const { wardrobeState } = useFitCheck();
 const item = wardrobeState.personalItems.find((item) => String(items).split(',').includes(item.id) && item.photoUri);
 return <View style={{ flex: 1 }}><FeaturePage title="Recognition & review."><Text style={ui.body}>Analyze {item ? item.name : 'a clothing photo'} with Gemini. Photos are sent only when you choose Analyze. These are recognition confidence and potential bias findings, not outfit taste scores. Saved analyses stay on this device.</Text></FeaturePage><View style={{ flex: 4 }}><TaggingAccuracyReportScreen report={emptyAccuracyReport} initialImage={item ? { uri: resolveImageUri(item.photoUri), mimeType: 'image/jpeg', fileName: 'wardrobe.jpg' } : null} /></View></View>;
}
