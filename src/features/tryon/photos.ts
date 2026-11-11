import { Alert, Image, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
export type Photo = ImagePicker.ImagePickerAsset;
export function validPhoto(photo: Photo | null | undefined): photo is Photo {
  return !!photo && typeof photo.uri === 'string' && photo.uri.length > 0 && Number.isFinite(photo.width) && photo.width > 0 && Number.isFinite(photo.height) && photo.height > 0 && (!photo.type || photo.type === 'image') && (!photo.mimeType || photo.mimeType.startsWith('image/'));
}
export async function chooseImage(camera: boolean): Promise<Photo | null> {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Enable camera access for Expo Go in device settings to take a photo. You can also choose Photo Library.', [{ text: 'Cancel', style: 'cancel' }, ...(!permission.canAskAgain ? [{ text: 'Open Settings', onPress: () => { Linking.openSettings().catch(() => Alert.alert('Open device settings', 'Enable camera access for Expo Go in Settings.')); } }] : [])]);
      return null;
    }
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: false, allowsMultipleSelection: false, quality: 1 };
  const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const asset = result.assets?.[0];
  if (!validPhoto(asset)) throw new Error('Please choose a valid image.');
  await new Promise<void>((resolve, reject) => Image.getSize(asset.uri, (w, h) => w > 0 && h > 0 ? resolve() : reject(new Error('This image is empty.')), () => reject(new Error('This image could not be opened. Please choose another.'))));
  return asset;
}
