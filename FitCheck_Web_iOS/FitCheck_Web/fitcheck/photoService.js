import { Platform } from 'react-native';
import { PHOTO_SERVICE_URL } from './constants';

// Items saved before photo-service existed still have a dead blob: or
// data: reference in AsyncStorage (blob: URLs die on reload; data: URIs
// work but were from an earlier approach we've since moved off of). There's
// no way to recover the original bytes from a dead blob: URL, but on this
// dev VM the same placeholder photos used to create those items are still
// sitting in item-photos/ and servable over HTTP from the Expo web dev
// server, so we can re-fetch a matching one by color + category and
// upload it to photo-service like any newly-picked photo. This is a
// one-time, self-healing migration: it only ever touches items whose
// image is still a blob:/data: URI, which the fixed pickers no longer produce.
export const LEGACY_IMAGE_RECOVERY_PHOTOS = [
    { color: 'Red', category: 'Tops', file: 'red-tshirt.png' },
    { color: 'Blue', category: 'Tops', file: 'blue-tshirt.png' },
    { color: 'Blue', category: 'Bottoms', file: 'blue-shorts.png' },
    { color: 'White', category: 'Bottoms', file: 'white-long-pants.png' },
];

export function isLegacyImageUri(uri) {
    return typeof uri === 'string' && (uri.startsWith('blob:') || uri.startsWith('data:'));
}

export async function recoverLegacyImage(item) {
    const match = LEGACY_IMAGE_RECOVERY_PHOTOS.find(
    (candidate) => candidate.color === item.color && candidate.category === item.category
    );
    if (!match) return null;
    try {
        const response = await fetch(`/item-photos/${match.file}`);
        if (!response.ok) return null;
        const blob = await response.blob();
        return await uploadPhotoBlob(blob, match.file);
    } catch (error) {
        console.warn('Failed to recover legacy photo for', item.id, error);
        return null;
    }   
}

// Expo 57's global fetch rejects React Native URI form parts. XMLHttpRequest
// uses RN's native multipart encoder, which reads these local files directly.
async function sendPhoto(path, photo, fileName) {
    const formData = new FormData();
    if (Platform.OS === 'web') {
        formData.append('photo', photo, fileName);
        const response = await fetch(`${PHOTO_SERVICE_URL}${path}`, {
            method: 'POST',
            body: formData,
        });
        if (!response.ok) throw new Error(`Photo request failed with status ${response.status}`);
        return response.json();
    }
    formData.append('photo', photo);
    return new Promise((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open('POST', `${PHOTO_SERVICE_URL}${path}`);
        request.timeout = 60000;
        request.onload = () => {
            if (request.status < 200 || request.status >= 300) {
                reject(new Error(`Photo request failed with status ${request.status}`));
                return;
            }
            try {
                resolve(JSON.parse(request.responseText));
            } catch {
                reject(new Error('Photo service returned an invalid response'));
            }
        };
        request.onerror = () => reject(new Error('Cannot reach the photo service'));
        request.ontimeout = () => reject(new Error('Photo request timed out'));
        request.onabort = () => reject(new Error('Photo request was canceled'));
        // Leave Content-Type unset so the native encoder supplies its boundary.
        request.send(formData);
    });
}

export async function uploadPhotoBlob(blob, fileName) {
    const { url } = await sendPhoto('/photos', blob, fileName);
    return url;
}

export async function tagPhotoBlob(blob, fileName) {
    return sendPhoto('/tag', blob, fileName);
}

// Web uploads a Blob; React Native uploads the picked file directly by URI.
async function readPhotoAsset(asset) {
    const fileName = asset.fileName || 'photo.jpg';
    if (Platform.OS !== 'web') {
        return {
            blob: { uri: asset.uri, name: fileName, type: asset.mimeType || 'image/jpeg' },
            fileName,
        };
    }
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    return { blob, fileName };
}

export async function uploadPhoto(asset) {
    const { blob, fileName } = await readPhotoAsset(asset);
    return uploadPhotoBlob(blob, fileName);
}

export async function processPhoto(asset) {
    const { blob, fileName } = await readPhotoAsset(asset);
    const url = await uploadPhotoBlob(blob, fileName);
    let tags = null;
    try {
        tags = await tagPhotoBlob(blob, fileName);
    } catch (error) {
        console.warn('Photo uploaded, but tagging failed:', error);
    }
    return { url, tags };
}

export async function importPhotoUrl(imageUrl) {
    const response = await fetch(`${PHOTO_SERVICE_URL}/photos/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl.trim() }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not import this image.');
    return result;
}
