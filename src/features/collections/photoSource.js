import { Asset } from 'expo-asset';
import { itemImageSource } from './publicPhotos';
export { itemImageSource };
export function resolveImageUri(uri) {
 if (!uri?.startsWith('public-photo:')) return uri;
 const source = itemImageSource(uri);
 return source ? Asset.fromModule(source).uri : '';
}
