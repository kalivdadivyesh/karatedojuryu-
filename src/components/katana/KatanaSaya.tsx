import { useMemo } from "react";
import * as THREE from "three";

export default function KatanaSaya({ drawProgress }: { drawProgress: number }) {
  const sayaGeo = useMemo(() => {
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.5, 0.03, 0),
      new THREE.Vector3(3.0, 0.05, 0),
      new THREE.Vector3(4.2, 0.04, 0)
    );
    const shape = new THREE.Shape();
    shape.ellipse(0, 0, 0.034, 0.026, 0, Math.PI * 2, false, 0);
    return new THREE.ExtrudeGeometry(shape, {
      steps: 80,
      extrudePath: curve,
      bevelEnabled: false,
    });
  }, []);

  return (
    <group
      position={[0, -0.04 - drawProgress * 0.2, 0]}
      rotation={[0, 0, drawProgress * 0.1]}
    >
      {/* Main body - deep lacquer */}
      <mesh geometry={sayaGeo}>
        <meshPhysicalMaterial
          color="#080808"
          metalness={0.6}
          roughness={0.08}
          clearcoat={1}
          clearcoatRoughness={0.03}
        />
      </mesh>
      {/* Koiguchi */}
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.031, 0.005, 8, 24]} />
        <meshPhysicalMaterial color="#1a1917" metalness={0.95} roughness={0.08} />
      </mesh>
      {/* Kojiri */}
      <mesh position={[4.15, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.028, 0.04, 12]} />
        <meshPhysicalMaterial color="#1a1917" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Kurikata */}
      <mesh position={[0.9, 0.03, 0]}>
        <boxGeometry args={[0.04, 0.01, 0.035]} />
        <meshPhysicalMaterial color="#1a1917" metalness={0.9} roughness={0.12} />
      </mesh>
    </group>
  );
}
