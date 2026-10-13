import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { Image, Platform } from 'react-native';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { avatarTextures } from './avatarTextures';

// No uploaded photographs enter this loader. All assets are bundled locally.
export async function loadDemoAvatar() {
  // Metro requires a static require for bundled binary assets.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const asset = Asset.fromModule(require('../assets/avatar/demo.glb'));
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  const buffer = Platform.OS === 'web' ? await (await fetch(uri)).arrayBuffer() : await new File(uri).arrayBuffer();
  const loader = new GLTFLoader();
  if (Platform.OS !== 'web') {
    // Expo GL accepts localUri image objects. Avoid DOM Image/blob APIs on native.
    loader.register(parser => ({
      name: 'EXPO_BUNDLED_TEXTURES',
      async loadTexture(index: number) {
        const definition = parser.json.textures[index];
        const imageModule = avatarTextures[definition.source];
        if (imageModule === undefined) throw new Error('Bundled avatar texture is missing.');
        const image = Asset.fromModule(imageModule);
        await image.downloadAsync();
        const localUri = image.localUri ?? image.uri;
        const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => Image.getSize(localUri, (width, height) => resolve({ width, height }), reject));
        const texture = new THREE.Texture();
        texture.image = { localUri, ...dimensions };
        texture.flipY = false;
        const sampler = parser.json.samplers?.[definition.sampler] ?? {};
        texture.wrapS = sampler.wrapS === 33071 ? THREE.ClampToEdgeWrapping : sampler.wrapS === 33648 ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
        texture.wrapT = sampler.wrapT === 33071 ? THREE.ClampToEdgeWrapping : sampler.wrapT === 33648 ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.needsUpdate = true;
        parser.associations.set(texture, { textures: index });
        return texture;
      },
    }));
  }
  return (await loader.parseAsync(buffer, '')).scene;
}
