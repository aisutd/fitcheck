const SKIN_COLOR = { deep: '#70432F', tan: '#A56F4C', medium: '#C58F69', light: '#E0B997' };
const HAIR_COLOR = { dark: '#292522', brown: '#694632', copper: '#A95635' };
const OUTFIT_COLOR = { forest: '#315A48', terracotta: '#B55F49', blue: '#476F91', plum: '#79556F' };
const FRAME_SCALE = { petite: 0.94, average: 1, tall: 1.07 };

export default function AvatarFigure({ customization, yaw = 0, segments = 10, clothing = { sleeves: 'short', bottoms: 'long', layer: false } }) {
  const skin = SKIN_COLOR[customization.skinTone];
  const hair = HAIR_COLOR[customization.hairColor];

  return (
    <group rotation={[0, yaw, 0]} scale={[1, FRAME_SCALE[customization.bodyFrame], 1]}>
      <mesh position={[0, -1.42, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.65, segments]} />
        <meshStandardMaterial color="#DCE3DA" roughness={1} />
      </mesh>

      <mesh position={[-0.16, -0.47, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.095, 0.78, segments]} />
        <meshStandardMaterial color={clothing.bottoms === 'short' ? skin : '#343B38'} roughness={0.85} />
      </mesh>
      <mesh position={[0.16, -0.47, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.095, 0.78, segments]} />
        <meshStandardMaterial color={clothing.bottoms === 'short' ? skin : '#343B38'} roughness={0.85} />
      </mesh>
      {clothing.bottoms === 'short' ? [-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, -0.23, 0]}>
          <cylinderGeometry args={[0.128, 0.12, 0.35, segments]} />
          <meshStandardMaterial color="#343B38" roughness={0.85} />
        </mesh>
      )) : null}
      <mesh position={[-0.16, -0.91, 0.045]} castShadow>
        <boxGeometry args={[0.2, 0.16, 0.38]} />
        <meshStandardMaterial color="#EEECE5" roughness={0.8} />
      </mesh>
      <mesh position={[0.16, -0.91, 0.045]} castShadow>
        <boxGeometry args={[0.2, 0.16, 0.38]} />
        <meshStandardMaterial color="#EEECE5" roughness={0.8} />
      </mesh>

      <mesh position={[0, 0.48, 0]} castShadow>
        <cylinderGeometry args={[0.29, 0.32, 0.77, segments]} />
        <meshStandardMaterial color={OUTFIT_COLOR[customization.outfitColor]} roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.07, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.24, 0.3, segments]} />
        <meshStandardMaterial color="#343B38" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.91, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.18, segments]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>

      <mesh position={[-0.37, 0.54, 0]} rotation={[0, 0, -0.12]} castShadow>
        <cylinderGeometry args={[0.11, 0.085, 0.53, segments]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>
      <mesh position={[0.37, 0.54, 0]} rotation={[0, 0, 0.12]} castShadow>
        <cylinderGeometry args={[0.11, 0.085, 0.53, segments]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.37, clothing.sleeves === 'long' ? 0.54 : 0.69, 0]} rotation={[0, 0, side * 0.12]}>
          <cylinderGeometry args={[0.119, 0.094, clothing.sleeves === 'long' ? 0.53 : 0.23, segments]} />
          <meshStandardMaterial color={OUTFIT_COLOR[customization.outfitColor]} roughness={0.8} />
        </mesh>
      ))}
      {clothing.layer ? (
        <mesh position={[0, 0.39, 0]}>
          <cylinderGeometry args={[0.31, 0.35, 0.92, segments]} />
          <meshStandardMaterial color="#A39D8E" roughness={0.85} />
        </mesh>
      ) : null}
      <mesh position={[-0.4, 0.23, 0]} castShadow>
        <sphereGeometry args={[0.095, segments, segments]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>
      <mesh position={[0.4, 0.23, 0]} castShadow>
        <sphereGeometry args={[0.095, segments, segments]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>

      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.265, segments, segments]} />
        <meshStandardMaterial color={skin} roughness={0.88} />
      </mesh>
      <mesh position={[-0.085, 1.235, 0.242]}>
        <sphereGeometry args={[0.027, segments, segments]} />
        <meshStandardMaterial color="#342C28" roughness={0.75} />
      </mesh>
      <mesh position={[0.085, 1.235, 0.242]}>
        <sphereGeometry args={[0.027, segments, segments]} />
        <meshStandardMaterial color="#342C28" roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.17, 0.255]}>
        <sphereGeometry args={[0.027, segments, segments]} />
        <meshStandardMaterial color={skin} roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.105, 0.242]} scale={[1, 0.24, 0.35]}>
        <sphereGeometry args={[0.055, segments, segments]} />
        <meshStandardMaterial color="#75483A" roughness={0.8} />
      </mesh>
      <mesh position={[-0.263, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.052, segments, segments]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>
      <mesh position={[0.263, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.052, segments, segments]} />
        <meshStandardMaterial color={skin} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.37, 0]} scale={[1.03, 0.56, 1.04]} castShadow>
        <sphereGeometry args={[0.27, segments, segments]} />
        <meshStandardMaterial color={hair} roughness={0.95} />
      </mesh>
      {customization.hairStyle === 'long' ? (
        <mesh position={[0, 1.07, -0.13]} scale={[0.83, 1.45, 0.48]} castShadow>
          <sphereGeometry args={[0.22, segments, segments]} />
          <meshStandardMaterial color={hair} roughness={0.95} />
        </mesh>
      ) : null}
      {customization.hairStyle === 'curly'
        ? [-0.17, 0, 0.17].map((x, index) => (
          <mesh key={x} position={[x, 1.4 + (index === 1 ? 0.04 : 0), 0]} castShadow>
            <sphereGeometry args={[0.115, segments, segments]} />
            <meshStandardMaterial color={hair} roughness={0.95} />
          </mesh>
        ))
        : null}
    </group>
  );
}
