import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";

/**
 * Curved katana blade using a custom path with proper curvature
 */
function KatanaBlade({ drawProgress }: { drawProgress: number }) {
  const bladeGroup = useRef<THREE.Group>(null);

  const bladeGeo = useMemo(() => {
    // Create a curved blade path (sori - curvature)
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.2, 0.06, 0),
      new THREE.Vector3(2.4, 0.12, 0),
      new THREE.Vector3(3.6, 0.08, 0) // kissaki tip drops slightly
    );
    const points = curve.getPoints(60);

    // Build blade as a custom buffer geometry with width tapering
    const vertices: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < points.length; i++) {
      const t = i / (points.length - 1);
      const p = points[i];
      // Width tapers from 0.035 at base to 0.005 at tip
      const halfW = 0.035 * (1 - t * 0.85);
      // Thickness tapers
      const halfT = 0.012 * (1 - t * 0.7);

      // Top face vertices (4 per cross-section: top-left, top-right, bot-right, bot-left)
      // Spine (mune)
      vertices.push(p.x, p.y + halfW, p.z + halfT);
      normals.push(0, 0.7, 0.7);
      uvs.push(t, 1);

      // Edge (ha) - cutting edge
      vertices.push(p.x, p.y - halfW, p.z);
      normals.push(0, -1, 0);
      uvs.push(t, 0);

      // Bottom spine
      vertices.push(p.x, p.y + halfW, p.z - halfT);
      normals.push(0, 0.7, -0.7);
      uvs.push(t, 1);

      if (i < points.length - 1) {
        const base = i * 3;
        const next = (i + 1) * 3;
        // Front face
        indices.push(base, next, base + 1);
        indices.push(base + 1, next, next + 1);
        // Back face
        indices.push(base + 1, next + 1, base + 2);
        indices.push(base + 2, next + 1, next + 2);
        // Top face (spine)
        indices.push(base + 2, next + 2, base);
        indices.push(base, next + 2, next);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  const bladeOffset = drawProgress * 3.0;

  return (
    <group ref={bladeGroup} position={[-1.8 + bladeOffset, 0, 0]}>
      {/* Main blade */}
      <mesh geometry={bladeGeo}>
        <meshPhysicalMaterial
          color="#c8cdd3"
          metalness={1}
          roughness={0.05}
          reflectivity={1}
          clearcoat={0.8}
          clearcoatRoughness={0.05}
        />
      </mesh>
      {/* Hamon line - wavy temper pattern */}
      {Array.from({ length: 12 }).map((_, i) => {
        const t = 0.1 + i * 0.07;
        const x = t * 3.6;
        const y = 0.06 * t + Math.sin(i * 1.8) * 0.008 - 0.015;
        return (
          <mesh key={i} position={[x, y, 0.013]}>
            <sphereGeometry args={[0.006, 6, 6]} />
            <meshBasicMaterial color="#f0f0f0" transparent opacity={0.5} />
          </mesh>
        );
      })}
      {/* Cutting edge glow */}
      <mesh position={[1.8, -0.02, 0]}>
        <planeGeometry args={[3.6, 0.004]} />
        <meshBasicMaterial
          color="#ef4444"
          transparent
          opacity={0.2 + drawProgress * 0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function Tsuba() {
  // Square tsuba with rounded corners and dragon cutout pattern
  const tsubaGeo = useMemo(() => {
    const shape = new THREE.Shape();
    const s = 0.14;
    const r = 0.03;
    shape.moveTo(-s + r, -s);
    shape.lineTo(s - r, -s);
    shape.quadraticCurveTo(s, -s, s, -s + r);
    shape.lineTo(s, s - r);
    shape.quadraticCurveTo(s, s, s - r, s);
    shape.lineTo(-s + r, s);
    shape.quadraticCurveTo(-s, s, -s, s - r);
    shape.lineTo(-s, -s + r);
    shape.quadraticCurveTo(-s, -s, -s + r, -s);

    // Center hole for blade
    const hole = new THREE.Path();
    hole.ellipse(0, 0, 0.02, 0.04, 0, Math.PI * 2, false, 0);
    shape.holes.push(hole);

    return new THREE.ExtrudeGeometry(shape, { depth: 0.01, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2 });
  }, []);

  return (
    <group position={[0, 0, 0]}>
      <mesh geometry={tsubaGeo} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
        <meshPhysicalMaterial
          color="#292524"
          metalness={0.95}
          roughness={0.2}
          clearcoat={0.5}
        />
      </mesh>
      {/* Decorative inlay */}
      {[0.06, -0.06].map((offset) => (
        <mesh key={offset} position={[0, offset, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.03, 0.003, 6, 16]} />
          <meshStandardMaterial color="#b91c1c" metalness={0.9} roughness={0.2} emissive="#dc2626" emissiveIntensity={0.15} />
        </mesh>
      ))}
    </group>
  );
}

function Handle() {
  const handleGeo = useMemo(() => {
    // Slightly oval cross-section handle
    const shape = new THREE.Shape();
    shape.ellipse(0, 0, 0.022, 0.028, 0, Math.PI * 2, false, 0);
    const path = new THREE.LineCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.1, 0, 0)
    );
    return new THREE.ExtrudeGeometry(shape, {
      steps: 20,
      extrudePath: path,
      bevelEnabled: false,
    });
  }, []);

  return (
    <group position={[-1.1, 0, 0]}>
      {/* Base handle (same) */}
      <mesh geometry={handleGeo}>
        <meshStandardMaterial color="#0c0a09" metalness={0.2} roughness={0.9} />
      </mesh>
      {/* Ito wrap - diamond pattern */}
      {Array.from({ length: 10 }).map((_, i) => (
        <group key={i} position={[0.05 + i * 0.1, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.05, 0.05, 0.003]} />
            <meshStandardMaterial color="#7f1d1d" metalness={0.3} roughness={0.7} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.05, 0.05, 0.003]} />
            <meshStandardMaterial color="#991b1b" metalness={0.3} roughness={0.7} />
          </mesh>
        </group>
      ))}
      {/* Fuchi (collar) */}
      <mesh position={[1.08, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.025, 16]} />
        <meshPhysicalMaterial color="#44403c" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Kashira (pommel cap) */}
      <mesh position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.028, 0.024, 0.03, 16]} />
        <meshPhysicalMaterial color="#292524" metalness={0.95} roughness={0.15} />
      </mesh>
      {/* Menuki ornaments - both sides */}
      <mesh position={[0.4, 0.03, 0]}>
        <dodecahedronGeometry args={[0.012, 0]} />
        <meshStandardMaterial color="#b91c1c" metalness={0.9} roughness={0.15} emissive="#ef4444" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0.65, -0.03, 0]}>
        <dodecahedronGeometry args={[0.012, 0]} />
        <meshStandardMaterial color="#b91c1c" metalness={0.9} roughness={0.15} emissive="#ef4444" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function Scabbard({ drawProgress }: { drawProgress: number }) {
  const scabbardGeo = useMemo(() => {
    // Curved scabbard matching blade curvature
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.2, 0.05, 0),
      new THREE.Vector3(2.4, 0.1, 0),
      new THREE.Vector3(3.5, 0.07, 0)
    );
    const shape = new THREE.Shape();
    shape.ellipse(0, 0, 0.028, 0.035, 0, Math.PI * 2, false, 0);
    return new THREE.ExtrudeGeometry(shape, {
      steps: 50,
      extrudePath: curve,
      bevelEnabled: false,
    });
  }, []);

  return (
    <group position={[0.05, -0.06 - drawProgress * 0.25, 0]} rotation={[0, 0, drawProgress * 0.12]}>
      <mesh geometry={scabbardGeo}>
        <meshPhysicalMaterial
          color="#1a1110"
          metalness={0.6}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>
      {/* Koiguchi (mouth) ring */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.032, 0.005, 8, 16]} />
        <meshPhysicalMaterial color="#78350f" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Kurikata (cord knob) */}
      <mesh position={[0.6, 0.04, 0]}>
        <boxGeometry args={[0.04, 0.015, 0.04]} />
        <meshPhysicalMaterial color="#44403c" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Sageo cord loop */}
      <mesh position={[0.6, 0.06, 0]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.025, 0.004, 6, 12, Math.PI * 1.5]} />
        <meshStandardMaterial color="#991b1b" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* Kojiri (end cap) */}
      <mesh position={[3.45, 0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.03, 0.04, 12]} />
        <meshPhysicalMaterial color="#292524" metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  );
}

function FloatingEmbers() {
  const meshRef = useRef<THREE.Points>(null);
  const count = 300;

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      sz[i] = Math.random() * 0.02 + 0.005;
    }
    return [pos, sz];
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.015;
    // Slowly drift upward
    const posArr = meshRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      posArr[i * 3 + 1] += 0.001;
      if (posArr[i * 3 + 1] > 5) posArr[i * 3 + 1] = -5;
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.012} color="#ef4444" transparent opacity={0.5} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  );
}

function KatanaModel() {
  const groupRef = useRef<THREE.Group>(null);
  const drawProgressRef = useRef(0);
  const targetDraw = useRef(0);
  const targetRotX = useRef(0.05);
  const targetRotY = useRef(-0.2);
  const targetRotZ = useRef(0.1);
  const targetZ = useRef(0);
  const [drawProgress, setDrawProgress] = useState(0);
  const { viewport } = useThree();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowH = window.innerHeight;
      const totalScroll = document.documentElement.scrollHeight - windowH;
      const progress = Math.min(1, scrollY / totalScroll);

      // Draw sword from scabbard early
      targetDraw.current = Math.min(1, progress * 3);

      // Move towards camera
      targetZ.current = progress * 3.5;

      // Rotate to face viewer
      targetRotX.current = 0.05 + progress * 0.35;
      targetRotY.current = -0.2 + progress * (Math.PI * 0.75);
      targetRotZ.current = 0.1 - progress * 0.55;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useFrame(({ clock, pointer }) => {
    if (!groupRef.current) return;

    const lerpSpeed = 0.03;

    drawProgressRef.current += (targetDraw.current - drawProgressRef.current) * lerpSpeed;
    setDrawProgress(drawProgressRef.current);

    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ.current, lerpSpeed);

    const cx = pointer.y * 0.06;
    const cy = pointer.x * 0.08;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX.current + cx, lerpSpeed);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY.current + cy, lerpSpeed);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ.current, lerpSpeed);

    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, lerpSpeed);
    groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.35) * 0.03;

    const baseScale = Math.min(viewport.width / 4.5, 1.4);
    const scrollScale = 1 + (targetZ.current / 3.5) * 0.6;
    const s = THREE.MathUtils.lerp(groupRef.current.scale.x, baseScale * scrollScale, lerpSpeed);
    groupRef.current.scale.setScalar(s);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[0.05, -0.2, 0.1]}>
      <KatanaBlade drawProgress={drawProgress} />
      <Tsuba />
      <Handle />
      <Scabbard drawProgress={drawProgress} />
    </group>
  );
}

export default function HeroCanvas() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0.2, 3.5], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[4, 6, 5]} intensity={1.5} color="#fafafa" />
        <directionalLight position={[-3, 2, 4]} intensity={0.5} color="#dc2626" />
        <spotLight position={[0, 3, 4]} intensity={0.8} angle={0.4} penumbra={0.5} color="#fef3c7" />
        <pointLight position={[2, 0.5, 2]} intensity={0.5} color="#ef4444" distance={6} />
        <pointLight position={[-2, -1, 2]} intensity={0.3} color="#d97706" distance={5} />
        <directionalLight position={[0, -2, -3]} intensity={0.2} color="#fef3c7" />
        <FloatingEmbers />
        <KatanaModel />
      </Canvas>
    </div>
  );
}
