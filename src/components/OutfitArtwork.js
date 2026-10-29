import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

// Category illustrations are visual aids, not photographs or virtual try-on.
function Garment({ item }) {
  const [failedUri, setFailedUri] = useState('');
  if (item.photoUri && failedUri !== item.photoUri) {
    return <Image source={{ uri: item.photoUri }} resizeMode="contain" style={styles.photo}
      accessibilityLabel={item.name} onError={() => setFailedUri(item.photoUri)} />;
  }
  const color = /^#[0-9a-f]{6}$/i.test(item.colorHex || '') ? item.colorHex : '#A9ADA3';
  const name = item.name.toLowerCase();
  const isShort = name.includes('short');
  const seam = 'rgba(0,0,0,0.19)';
  let shape;
  if (item.category === 'bottom') {
    shape = name.includes('skirt') ? <>
      <Path d="M37 15 L83 15 L106 134 Q60 143 14 134 Z" fill={color} stroke={seam} />
      <Path d="M38 22 H82 M45 25 L34 132 M60 25 V136 M75 25 L86 132" stroke={seam} fill="none" />
    </> : <>
      <Path d={isShort ? 'M29 19 H91 L101 91 L65 94 L60 49 L55 94 L19 91 Z' : 'M29 10 H91 L96 139 L65 139 L60 50 L55 139 L24 139 Z'} fill={color} stroke={seam} />
      <Path d="M30 19 H90 M60 20 V47 M31 24 Q43 44 47 24 M89 24 Q77 44 73 24" stroke={seam} fill="none" />
      <Circle cx="60" cy="15" r="1.5" fill={seam} />
    </>;
  } else if (item.category === 'shoes') {
    const boot = name.includes('boot');
    shape = <G transform="translate(0 28)">
      {[0, 1].map((side) => <G key={side} transform={`translate(${side * 5} ${side * 40}) rotate(-12 60 50)`}>
        <Path d={boot ? 'M28 6 H62 V40 Q72 45 94 47 Q111 56 100 65 H24 L22 40 Z' : 'M24 35 L45 25 Q58 48 78 43 Q103 44 105 58 Q106 65 97 66 H22 Q16 50 24 35 Z'} fill={color} stroke={seam} />
        <Path d="M23 61 H101 M52 43 L67 46 M56 48 L72 51" stroke={seam} fill="none" strokeWidth="2" />
      </G>)}
    </G>;
  } else if (item.category === 'layer') {
    shape = <>
      <Path d="M42 13 L60 21 L78 13 L95 24 L114 104 L97 109 L86 66 L89 137 H31 L34 66 L23 109 L6 104 L25 24 Z" fill={color} stroke={seam} />
      <Path d="M43 14 L60 48 L77 14 L83 39 L64 66 L64 137 M39 82 H51 M72 82 H84" fill="none" stroke={seam} strokeWidth="1.5" />
      <Circle cx="66" cy="88" r="1.7" fill={seam} /><Circle cx="66" cy="107" r="1.7" fill={seam} />
    </>;
  } else if (item.category === 'accessory') {
    shape = <><Path d="M25 52 H95 L101 126 H19 Z" fill={color} stroke={seam} /><Path d="M40 53 V39 Q60 13 80 39 V53" fill="none" stroke={color} strokeWidth="7" /></>;
  } else {
    const long = name.includes('long') || name.includes('turtle') || name.includes('shirt') || name.includes('blouse');
    shape = <>
      <Path d={long ? 'M41 18 Q60 32 79 18 L95 28 L113 105 L96 111 L84 66 L87 132 H33 L36 66 L24 111 L7 105 L25 28 Z' : 'M40 23 Q60 40 80 23 L111 46 L94 72 L82 61 L86 132 H34 L38 61 L26 72 L9 46 Z'} fill={color} stroke={seam} />
      <Path d={name.includes('shirt') || name.includes('polo') ? 'M41 19 L52 43 L60 31 L68 43 L79 19 M60 33 V128' : 'M42 25 Q60 44 78 25'} fill="none" stroke={seam} strokeWidth="1.5" />
      <Path d="M36 125 H84" fill="none" stroke={seam} />
    </>;
  }
  return <Svg width="100%" height="100%" viewBox="0 0 120 150" accessible={false}>{shape}</Svg>;
}

export default function OutfitArtwork({ items }) {
  const hasLayer = items.some((item) => item.category === 'layer');
  return <View accessible accessibilityRole="image" style={styles.stage} accessibilityLabel={`Outfit preview: ${items.map((item) => item.name).join(', ')}`}>
    <View pointerEvents="none" style={styles.circle} />
    {items.map((item) => <View key={item.id} style={[styles.garment, styles[item.category], !hasLayer && item.category === 'top' && styles.topSolo]}>
      <Garment item={item} />
    </View>)}
    <Text style={styles.caption}>{items.every((item) => item.photoUri) ? 'YOUR WARDROBE' : 'ILLUSTRATED PIECES'}</Text>
  </View>;
}
const styles = StyleSheet.create({
  stage: { width: '100%', aspectRatio: 0.94, backgroundColor: '#EDEBE4', position: 'relative', overflow: 'hidden' },
  circle: { position: 'absolute', width: '86%', aspectRatio: 1, borderRadius: 500, backgroundColor: '#E5E3D9', left: '7%', top: '12%' },
  garment: { position: 'absolute', width: '48%', height: '56%' },
  top: { left: '3%', top: '4%', transform: [{ rotate: '-9deg' }] },
  topSolo: { width: '56%', height: '61%', left: '1%' },
  bottom: { right: '2%', bottom: '5%', height: '65%', transform: [{ rotate: '7deg' }] },
  layer: { right: '1%', top: '2%', width: '46%', height: '51%', transform: [{ rotate: '9deg' }] },
  shoes: { left: '4%', bottom: '7%', width: '46%', height: '33%', transform: [{ rotate: '-13deg' }] },
  accessory: { left: '0%', bottom: '13%', width: '26%', height: '30%' },
  photo: { width: '100%', height: '100%' },
  caption: { position: 'absolute', bottom: 12, left: 16, color: '#65675F', fontSize: 9, letterSpacing: 1.5, fontWeight: '600' },
});
