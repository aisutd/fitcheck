import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export async function exportCloset(content: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('File sharing is not available on this device.');
  if (!FileSystem.cacheDirectory) throw new Error('Temporary storage is unavailable.');
  const uri = `${FileSystem.cacheDirectory}fitcheck-closet-demo.json`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Export your Fitcheck demo closet', UTI: 'public.json' });
}
