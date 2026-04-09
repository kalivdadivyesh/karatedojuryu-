import { useMemo } from "react";
import * as THREE from "three";

export default function KatanaBlade({ drawProgress }: { drawProgress: number }) {
  const bladeGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const segments = 100;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const sori = Math.sin(t * Math.PI * 0.3) * 0.06;
      const w = 0.028 * (1 - t * 0.85);
      pts.push(new THREE.Vector2(t * 4.5, sori + w));
    }
    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const sori = Math.sin(t * Math.PI * 0.3) * 0.06;
      const w = 0.028 * (1 - t * 0.85);
      pts.push(new THREE.Vector2(t * 4.5, sori - w * 0.5));
    }
    const shape = new THREE.Shape(pts);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.014,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.001,
      bevelSegments: 2,
    });
  }, []);

  // Blade slides out based on draw progress
  const bladeOffset = drawProgress * 4.2;

  return (
    <group position={[-2.1 + bladeOffset, 0, -0.007]}>
      {/* Main blade */}
      <mesh geometry={bladeGeo}>
        <meshPhysicalMaterial
          color="#dfe6ed"
          metalness={1}
          roughness={0.02}
          reflectivity={1}
          clearcoat={1}
          clearcoatRoughness={0.01}
          envMapIntensity={2}
        />
      </mesh>
      {/* Hamon line */}
      <mesh position={[2.25, 0.015, 0.008]}>
        <planeGeometry args={[4.3, 0.012]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.08 + drawProgress * 0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Cutting edge highlight */}
      <mesh position={[2.25, -0.003, 0.008]}>
        <planeGeometry args={[4.3, 0.0015]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
