import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";

/* ─── Stylized Katana Blade ─── */
function Blade({ drawProgress }: { drawProgress: number }) {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const segments = 80;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      // Gentle sori (curvature)
      const y = Math.sin(t * Math.PI * 0.35) * 0.08;
      // Width tapers from base to kissaki
      const w = 0.032 * (1 - t * 0.82);
      pts.push(new THREE.Vector2(t * 4.2, y + w));
    }
    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      const y = Math.sin(t * Math.PI * 0.35) * 0.08;
      const w = 0.032 * (1 - t * 0.82);
      pts.push(new THREE.Vector2(t * 4.2, y - w * 0.6)); // Asymmetric - edge thinner
    }
    const shape = new THREE.Shape(pts);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.002,
      bevelSegments: 2,
    });
  }, []);

  const offset = drawProgress * 3.8;

  return (
    <group position={[-2 + offset, 0, -0.009]}>
      {/* Steel blade */}
      <mesh geometry={geo}>
        <meshPhysicalMaterial
          color="#e8ecf0"
          metalness={1}
          roughness={0.03}
          reflectivity={1}
          clearcoat={1}
          clearcoatRoughness={0.02}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Hamon (temper line) - subtle wavy glow */}
      <mesh position={[2.1, 0.02, 0.01]}>
        <planeGeometry args={[4.0, 0.015]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.12 + drawProgress * 0.08}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Edge highlight */}
      <mesh position={[2.1, -0.005, 0.01]}>
        <planeGeometry args={[4.0, 0.002]} />
        <meshBasicMaterial
          color="#f8fafc"
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ─── Saya (Scabbard) ─── */
function Saya({ drawProgress }: { drawProgress: number }) {
  const geo = useMemo(() => {
    // Curved path matching blade sori
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.4, 0.04, 0),
      new THREE.Vector3(2.8, 0.07, 0),
      new THREE.Vector3(4.0, 0.05, 0)
    );
    const shape = new THREE.Shape();
    shape.ellipse(0, 0, 0.038, 0.03, 0, Math.PI * 2, false, 0);
    return new THREE.ExtrudeGeometry(shape, {
      steps: 60,
      extrudePath: curve,
      bevelEnabled: false,
    });
  }, []);

  return (
    <group
      position={[0, -0.05 - drawProgress * 0.3, 0]}
      rotation={[0, 0, drawProgress * 0.15]}
    >
      {/* Main scabbard body */}
      <mesh geometry={geo}>
        <meshPhysicalMaterial
          color="#0f0f0f"
          metalness={0.5}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>
      {/* Koiguchi (mouth) */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.035, 0.006, 8, 20]} />
        <meshPhysicalMaterial color="#1c1917" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Kojiri (end cap) */}
      <mesh position={[3.95, 0.05, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.032, 0.05, 12]} />
        <meshPhysicalMaterial color="#1c1917" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Kurikata knob */}
      <mesh position={[0.8, 0.035, 0]}>
        <boxGeometry args={[0.05, 0.012, 0.04]} />
        <meshPhysicalMaterial color="#1c1917" metalness={0.9} roughness={0.15} />
      </mesh>
    </group>
  );
}

/* ─── Tsuba (Guard) ─── */
function Tsuba() {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    // Round tsuba
    shape.absellipse(0, 0, 0.13, 0.11, 0, Math.PI * 2, false, 0);
    // Center slot for blade
    const hole = new THREE.Path();
    hole.ellipse(0, 0, 0.035, 0.015, 0, Math.PI * 2, false, 0);
    shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.008,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.003,
      bevelSegments: 3,
    });
  }, []);

  return (
    <group position={[0, 0.04, 0]}>
      <mesh geometry={geo} rotation={[Math.PI / 2, 0, Math.PI / 2]} position={[0, 0, -0.004]}>
        <meshPhysicalMaterial
          color="#1a1a1a"
          metalness={0.95}
          roughness={0.15}
          clearcoat={0.4}
        />
      </mesh>
    </group>
  );
}

/* ─── Tsuka (Handle) ─── */
function Tsuka() {
  const geo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.ellipse(0, 0, 0.024, 0.02, 0, Math.PI * 2, false, 0);
    const path = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.4, -0.01, 0),
      new THREE.Vector3(-0.8, -0.015, 0),
      new THREE.Vector3(-1.15, -0.01, 0)
    );
    return new THREE.ExtrudeGeometry(shape, {
      steps: 30,
      extrudePath: path,
      bevelEnabled: false,
    });
  }, []);

  return (
    <group position={[0, 0.04, 0]}>
      {/* Same core (ray skin) */}
      <mesh geometry={geo}>
        <meshStandardMaterial color="#f5f5f4" metalness={0.1} roughness={0.8} />
      </mesh>
      {/* Ito (cord wrap) - clean diagonal pattern */}
      {Array.from({ length: 14 }).map((_, i) => {
        const t = i / 13;
        const x = -0.05 - t * 1.05;
        const y = 0.04 - t * 0.01;
        return (
          <mesh key={i} position={[x, y, 0]} rotation={[0, 0, (i % 2 === 0 ? 1 : -1) * 0.5]}>
            <boxGeometry args={[0.015, 0.055, 0.028]} />
            <meshStandardMaterial color="#0a0a0a" metalness={0.15} roughness={0.85} />
          </mesh>
        );
      })}
      {/* Kashira (pommel) */}
      <mesh position={[-1.17, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.024, 0.022, 0.035, 12]} />
        <meshPhysicalMaterial color="#1a1a1a" metalness={0.95} roughness={0.12} />
      </mesh>
      {/* Fuchi (collar near guard) */}
      <mesh position={[-0.02, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.026, 0.026, 0.02, 12]} />
        <meshPhysicalMaterial color="#1a1a1a" metalness={0.95} roughness={0.12} />
      </mesh>
    </group>
  );
}

/* ─── Ambient particles ─── */
function DustParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 200;
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 16;
      p[i * 3 + 1] = (Math.random() - 0.5) * 10;
      p[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return p;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.008;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += 0.0005;
      if (arr[i * 3 + 1] > 5) arr[i * 3 + 1] = -5;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.008}
        color="#ffffff"
        transparent
        opacity={0.25}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─── Main Katana Assembly ─── */
function KatanaAssembly() {
  const group = useRef<THREE.Group>(null);
  const drawRef = useRef(0);
  const target = useRef({ draw: 0, z: 0, rotX: 0, rotY: -0.15, rotZ: Math.PI * 0.08 });
  const [drawProgress, setDrawProgress] = useState(0);
  const { viewport } = useThree();

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY;
      const wH = window.innerHeight;
      const total = document.documentElement.scrollHeight - wH;
      const p = Math.min(1, scrollY / total);

      // Unsheathe early
      target.current.draw = Math.min(1, p * 2.5);
      // Approach camera
      target.current.z = p * 3;
      // Rotate to face user — from resting angle to head-on
      target.current.rotX = p * 0.3;
      target.current.rotY = -0.15 + p * Math.PI * 0.65;
      target.current.rotZ = Math.PI * 0.08 - p * 0.4;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    const l = 0.025; // smooth lerp

    // Draw
    drawRef.current += (target.current.draw - drawRef.current) * l;
    setDrawProgress(drawRef.current);

    // Position
    group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, target.current.z, l);
    group.current.position.x = THREE.MathUtils.lerp(group.current.position.x, 0, l);
    group.current.position.y = Math.sin(clock.getElapsedTime() * 0.3) * 0.02;

    // Rotation + cursor
    const cx = pointer.y * 0.04;
    const cy = pointer.x * 0.06;
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, target.current.rotX + cx, l);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, target.current.rotY + cy, l);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, target.current.rotZ, l);

    // Scale
    const base = Math.min(viewport.width / 4, 1.5);
    const scroll = 1 + (target.current.z / 3) * 0.4;
    const s = THREE.MathUtils.lerp(group.current.scale.x, base * scroll, l);
    group.current.scale.setScalar(s);
  });

  return (
    <group ref={group} position={[0, 0, 0]} rotation={[0, -0.15, Math.PI * 0.08]}>
      <Blade drawProgress={drawProgress} />
      <Tsuba />
      <Tsuka />
      <Saya drawProgress={drawProgress} />
    </group>
  );
}

export default function HeroCanvas() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0.15, 4], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        {/* Clean, dramatic lighting */}
        <ambientLight intensity={0.15} />
        <directionalLight position={[3, 5, 5]} intensity={1.8} color="#f8fafc" />
        <directionalLight position={[-4, 3, 3]} intensity={0.3} color="#f8fafc" />
        <spotLight
          position={[0, 2, 5]}
          intensity={1}
          angle={0.3}
          penumbra={0.7}
          color="#ffffff"
        />
        {/* Subtle warm rim */}
        <pointLight position={[0, -2, -2]} intensity={0.15} color="#fef3c7" distance={8} />
        <DustParticles />
        <KatanaAssembly />
      </Canvas>
    </div>
  );
}
