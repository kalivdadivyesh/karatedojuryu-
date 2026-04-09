import { useMemo } from "react";
import * as THREE from "three";

export default function KatanaHandle() {
  // Tsuba (guard)
  const tsubaGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absellipse(0, 0, 0.12, 0.1, 0, Math.PI * 2, false, 0);
    const hole = new THREE.Path();
    hole.ellipse(0, 0, 0.032, 0.013, 0, Math.PI * 2, false, 0);
    shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.007,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 3,
    });
  }, []);

  // Tsuka (handle core)
  const tsukaGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.ellipse(0, 0, 0.022, 0.018, 0, Math.PI * 2, false, 0);
    const path = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.4, -0.008, 0),
      new THREE.Vector3(-0.8, -0.012, 0),
      new THREE.Vector3(-1.2, -0.008, 0)
    );
    return new THREE.ExtrudeGeometry(shape, {
      steps: 40,
      extrudePath: path,
      bevelEnabled: false,
    });
  }, []);

  return (
    <group position={[0, 0.035, 0]}>
      {/* Tsuba */}
      <mesh geometry={tsubaGeo} rotation={[Math.PI / 2, 0, Math.PI / 2]} position={[0, 0.005, -0.0035]}>
        <meshPhysicalMaterial
          color="#151515"
          metalness={0.95}
          roughness={0.12}
          clearcoat={0.5}
        />
      </mesh>

      {/* Same (rayskin) core */}
      <mesh geometry={tsukaGeo}>
        <meshStandardMaterial color="#f0f0ee" metalness={0.1} roughness={0.85} />
      </mesh>

      {/* Ito (cord wrap) */}
      {Array.from({ length: 16 }).map((_, i) => {
        const t = i / 15;
        const x = -0.04 - t * 1.1;
        const y = 0.035 - t * 0.008;
        return (
          <mesh key={i} position={[x, y, 0]} rotation={[0, 0, (i % 2 === 0 ? 1 : -1) * 0.45]}>
            <boxGeometry args={[0.012, 0.05, 0.025]} />
            <meshStandardMaterial color="#060606" metalness={0.12} roughness={0.9} />
          </mesh>
        );
      })}

      {/* Fuchi (collar) */}
      <mesh position={[-0.015, 0.035, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.024, 0.024, 0.018, 12]} />
        <meshPhysicalMaterial color="#151515" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* Kashira (pommel) */}
      <mesh position={[-1.22, 0.025, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.02, 0.03, 12]} />
        <meshPhysicalMaterial color="#151515" metalness={0.95} roughness={0.1} />
      </mesh>
    </group>
  );
}
