import { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

const cells = { top: [0, 0], bottom: [1, 0], shoes: [0, 1], layer: [1, 1] };
// Photos take precedence. Illustrations approximate category and color, not exact cut.
export default function GarmentIllustration({ category, colorHex, photoUri }) {
  const [failedPhoto, setFailedPhoto] = useState(null);
  const position = cells[category];
  if (photoUri && failedPhoto !== photoUri) {
    return <Image source={{ uri: photoUri }} accessible={false} resizeMode="contain" style={styles.photo} onError={() => setFailedPhoto(photoUri)} />;
  }
  if (!position) return null;
  const offset = { left: position[0] ? '-100%' : 0, top: position[1] ? '-100%' : 0 };
  return (
    <View style={styles.crop} pointerEvents="none">
      <Image source={require('../../assets/illustrations/wardrobe-flat-v2.png')} accessible={false} resizeMode="stretch" style={[styles.sheet, offset]} />
      {colorHex ? <Image source={require('../../assets/illustrations/wardrobe-flat-v2.png')} accessible={false} resizeMode="stretch" style={[styles.sheet, offset, { tintColor: colorHex, opacity: 0.65 }]} /> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  crop: { width: '100%', height: '100%', overflow: 'hidden' },
  sheet: { position: 'absolute', width: '200%', height: '200%' },
  photo: { width: '100%', height: '100%' },
});
