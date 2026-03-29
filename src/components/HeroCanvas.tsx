import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";

// Custom katana blade shape
function createBladeShape() {
  const shape = new THREE.Shape();
  // Blade profile - long and slightly curved
  shape.moveTo(0, -0.015);
  shape.lineTo(3.2, -0.008);
  shape.lineTo(3.5, 0); // tip
  shape.lineTo(3.2, 0.008);
  shape.lineTo(0, 0.015);
  shape.closePath();
  return shape;
}

function createScabbardShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.025);
  shape.quadraticCurveTo(1.8, -0.028, 3.3, -0.018);
  shape.lineTo(3.4, 0);
  shape.lineTo(3.3, 0.018);
  shape.quadraticCurveTo(1.8, 0.028, 0, 0.025);
  shape.closePath();
  return shape;
}

function KatanaBlade({ drawProgress }: { drawProgress: number }) {
  const bladeRef = useRef<THREE.Group>(null);

  const bladeMesh = useMemo(() => {
    const shape = createBladeShape();
    const extrudeSettings = { depth: 0.03, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 3 };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  // Blade slides out based on drawProgress
  const bladeOffset = drawProgress * 2.8;

  return (
    <group ref={bladeRef} position={[-1.5 + bladeOffset, 0, 0]}>
      {/* Main blade */}
      <mesh geometry={bladeMesh} position={[0, 0, -0.015]}>
        <meshStandardMaterial
          color="#d4d4d8"
          metalness={0.95}
          roughness={0.08}
          envMapIntensity={2}
        />
      </mesh>
      {/* Hamon line (temper line) */}
      <mesh position={[1.6, -0.005, 0.001]}>
        <planeGeometry args={[3.2, 0.008]} />
        <meshStandardMaterial
          color="#fafafa"
          metalness={1}
          roughness={0.02}
          transparent
          opacity={0.6}
          emissive="#ffffff"
          emissiveIntensity={0.15}
        />
      </mesh>
      {/* Edge glow */}
      <mesh position={[1.6, 0, 0.016]}>
        <planeGeometry args={[3.4, 0.003]} />
        <meshBasicMaterial color="#dc2626" transparent opacity={0.3 + drawProgress * 0.4} />
      </mesh>
    </group>
  );
}

function Tsuba() {
  return (
    <group position={[0, 0, 0]}>
      {/* Guard - oval shape */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.008, 32]} />
        <meshStandardMaterial color="#1c1917" metalness={0.9} roughness={0.3} />
      </mesh>
      {/* Guard detail ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.008, 8, 32]} />
        <meshStandardMaterial color="#78350f" metalness={0.85} roughness={0.25} emissive="#dc2626" emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
}

function Handle() {
  return (
    <group position={[-0.45, 0, 0]}>
      {/* Tsuka (handle) */}
      <mesh>
        <boxGeometry args={[0.85, 0.045, 0.04]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.3} roughness={0.8} />
      </mesh>
      {/* Wrap pattern (ito) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-0.35 + i * 0.1, 0, 0.021]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.04, 0.06, 0.003]} />
          <meshStandardMaterial color="#7f1d1d" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* Kashira (pommel) */}
      <mesh position={[-0.45, 0, 0]}>
        <sphereGeometry args={[0.028, 16, 16]} />
        <meshStandardMaterial color="#78350f" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Menuki (ornament) */}
      <mesh position={[-0.1, 0.025, 0]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshStandardMaterial color="#b91c1c" metalness={0.9} roughness={0.2} emissive="#dc2626" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function Scabbard({ drawProgress }: { drawProgress: number }) {
  const scabbardMesh = useMemo(() => {
    const shape = createScabbardShape();
    const extrudeSettings = { depth: 0.05, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 3 };
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  return (
    <group position={[0.15, -0.08 - drawProgress * 0.15, -0.025]}>
      <mesh geometry={scabbardMesh} rotation={[0, 0, 0.02 + drawProgress * 0.08]}>
        <meshStandardMaterial
          color="#1c1917"
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>
      {/* Scabbard mouth (koiguchi) */}
      <mesh position={[0.02, 0.0, 0.025]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.012, 16]} />
        <meshStandardMaterial color="#78350f" metalness={0.85} roughness={0.2} />
      </mesh>
      {/* Lacquer sheen stripe */}
      <mesh position={[1.7, 0.003, 0.052]}>
        <planeGeometry args={[3.2, 0.012]} />
        <meshStandardMaterial color="#7f1d1d" metalness={0.9} roughness={0.15} transparent opacity={0.4} />
      </mesh>
      {/* Sageo cord */}
      <mesh position={[0.5, -0.035, 0.025]}>
        <torusGeometry args={[0.04, 0.005, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#991b1b" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
}

function FloatingParticles() {
  const meshRef = useRef<THREE.Points>(null);
  const count = 400;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.02;
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#dc2626" transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

function KatanaModel() {
  const groupRef = useRef<THREE.Group>(null);
  const drawProgressRef = useRef(0);
  const targetDraw = useRef(0);
  const targetRotX = useRef(0.1);
  const targetRotY = useRef(-0.3);
  const targetRotZ = useRef(0.15);
  const targetZ = useRef(0);
  const [drawProgress, setDrawProgress] = useState(0);
  const { viewport } = useThree();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowH = window.innerHeight;
      const totalScroll = document.documentElement.scrollHeight - windowH;
      const progress = Math.min(1, scrollY / totalScroll);

      // Draw sword early
      targetDraw.current = Math.min(1, progress * 3);

      // Move towards camera
      targetZ.current = progress * 3;

      // Rotate to face the user as they scroll
      // Start: angled side view → End: blade pointing at camera
      targetRotX.current = 0.1 + progress * 0.4;           // tilt up slightly
      targetRotY.current = -0.3 + progress * (Math.PI * 0.8); // rotate around Y to face user
      targetRotZ.current = 0.15 - progress * 0.6;           // level out the tilt
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useFrame(({ clock, pointer }) => {
    if (!groupRef.current) return;

    const lerpSpeed = 0.035;

    // Smooth draw
    drawProgressRef.current += (targetDraw.current - drawProgressRef.current) * lerpSpeed;
    setDrawProgress(drawProgressRef.current);

    // Smooth Z movement
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, targetZ.current, lerpSpeed);

    // Smooth rotation towards user + subtle cursor reactivity
    const cursorInfluenceX = pointer.y * 0.08;
    const cursorInfluenceY = pointer.x * 0.1;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX.current + cursorInfluenceX, lerpSpeed);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY.current + cursorInfluenceY, lerpSpeed);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ.current, lerpSpeed);

    // Keep centered with subtle float
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, lerpSpeed);
    groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.04;

    // Subtle scale growth
    const baseScale = Math.min(viewport.width / 5, 1.2);
    const scrollScale = 1 + (targetZ.current / 3) * 0.5;
    const s = THREE.MathUtils.lerp(groupRef.current.scale.x, baseScale * scrollScale, lerpSpeed);
    groupRef.current.scale.setScalar(s);
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} rotation={[0.1, -0.3, 0.15]}>
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
        camera={{ position: [0, 0.3, 3], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#fafafa" />
        <directionalLight position={[-3, 2, 4]} intensity={0.4} color="#dc2626" />
        <pointLight position={[2, 1, 3]} intensity={0.6} color="#dc2626" distance={8} />
        <pointLight position={[-2, -1, 2]} intensity={0.3} color="#d97706" distance={6} />
        {/* Rim light for metallic sheen */}
        <directionalLight position={[0, -3, -2]} intensity={0.3} color="#fef3c7" />
        <FloatingParticles />
        <KatanaModel />
        {/* Environment approximation */}
        <fog attach="fog" args={["#0d0d0d", 5, 12]} />
      </Canvas>
    </div>
  );
}
