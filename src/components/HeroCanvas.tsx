import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useMemo, useState, useEffect } from "react";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useTexture } from "@react-three/drei";

/* ─── Shared scroll state (avoids React re-renders in useFrame) ─── */
const scrollState = {
  progress: 0,
  draw: 0,
  spin: 0,
  slash: 0,
  end: 0,
};

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
function mapRange(inMin: number, inMax: number, v: number) {
  return clamp01((v - inMin) / (inMax - inMin));
}

/* ─── Dust Particles ─── */
function DustParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 150;
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 14;
      p[i * 3 + 1] = (Math.random() - 0.5) * 8;
      p[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return p;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.006;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += 0.0004;
      if (arr[i * 3 + 1] > 4) arr[i * 3 + 1] = -4;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.006}
        color="#ffffff"
        transparent
        opacity={0.2}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─── Slash Light Streak (3D plane that appears during slash phase) ─── */
function SlashStreak() {
  const ref = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (!ref.current || !matRef.current) return;
    const s = scrollState.slash;
    // Quick flash: opacity peaks at 0.3-0.6, then fades
    const opacity = s < 0.2 ? s * 5 : s > 0.7 ? (1 - s) * 3.33 : 1;
    matRef.current.opacity = Math.max(0, opacity) * 0.8;
    // Scale and rotate
    ref.current.scale.x = 0.5 + s * 8;
    ref.current.scale.y = 1 + (1 - Math.abs(s - 0.5) * 2) * 2;
    ref.current.rotation.z = -0.8 + s * 0.3;
    ref.current.position.x = -2 + s * 4;
  });

  return (
    <mesh ref={ref} position={[0, 0, 0.5]}>
      <planeGeometry args={[1, 0.008]} />
      <meshBasicMaterial
        ref={matRef}
        color="#ff4444"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ─── Slash Particles (burst during slash) ─── */
function SlashParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 60;
  const basePositions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 0.5;
      p[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      p[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return p;
  }, []);
  const velocities = useMemo(() => {
    const v = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      v[i * 3] = Math.cos(angle) * speed;
      v[i * 3 + 1] = Math.sin(angle) * speed * 0.6;
      v[i * 3 + 2] = (Math.random() - 0.5) * speed * 0.3;
    }
    return v;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const s = scrollState.slash;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3] = basePositions[i * 3] + velocities[i * 3] * s;
      arr[i * 3 + 1] = basePositions[i * 3 + 1] + velocities[i * 3 + 1] * s;
      arr[i * 3 + 2] = basePositions[i * 3 + 2] + velocities[i * 3 + 2] * s;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    (ref.current.material as THREE.PointsMaterial).opacity = s > 0.05 && s < 0.9 ? (1 - s) * 0.9 : 0;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[basePositions.slice(), 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#ff6633"
        transparent
        opacity={0}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ─── Katana Image Sprite with scroll-driven phases ─── */
function KatanaAssembly() {
  const group = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const texture = useTexture("/images/katana.png");

  // Smoothed values
  const smooth = useRef({ draw: 0, spin: 0, slash: 0, end: 0 });

  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    const s = smooth.current;
    const t = scrollState;
    const l = 0.04;

    s.draw = THREE.MathUtils.lerp(s.draw, t.draw, l);
    s.spin = THREE.MathUtils.lerp(s.spin, t.spin, l);
    s.slash = THREE.MathUtils.lerp(s.slash, t.slash, l);
    s.end = THREE.MathUtils.lerp(s.end, t.end, l);

    // Spin
    const spinEase = s.spin < 0.5
      ? 2 * s.spin * s.spin
      : 1 - Math.pow(-2 * s.spin + 2, 2) / 2;
    const spinAngle = spinEase * Math.PI * 2;

    // Slash
    const slashEase = 1 - Math.pow(1 - s.slash, 3);
    const slashAngle = slashEase * -Math.PI * 0.6;

    // End
    const endZ = s.end * 2.5;
    const endRotY = s.end * Math.PI * 0.5;

    const targetRotX = s.draw * 0.1 + s.slash * 0.15;
    const targetRotY = -0.15 + spinAngle + endRotY;
    const targetRotZ = 0.25 - s.draw * 0.15 + slashAngle;

    const cx = pointer.y * 0.03;
    const cy = pointer.x * 0.04;

    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, targetRotX + cx, l);
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, targetRotY + cy, l);
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, targetRotZ, l);

    group.current.position.z = THREE.MathUtils.lerp(group.current.position.z, endZ, l);
    group.current.position.y = Math.sin(clock.getElapsedTime() * 0.25) * 0.015;

    const baseScale = Math.min(viewport.width / 4, 1.4);
    const scrollScale = 1 + s.end * 0.5;
    const targetScale = baseScale * scrollScale;
    const sc = THREE.MathUtils.lerp(group.current.scale.x, targetScale, l);
    group.current.scale.setScalar(sc);
  });

  // Aspect ratio of the katana image (wide horizontal)
  const aspect = texture.image ? texture.image.width / texture.image.height : 10;
  const planeHeight = 0.6;
  const planeWidth = planeHeight * aspect;

  return (
    <group ref={group} position={[0, 0, 0]} rotation={[0, -0.15, 0.25]}>
      <mesh>
        <planeGeometry args={[planeWidth, planeHeight]} />
        <meshBasicMaterial map={texture} transparent alphaTest={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ─── Scroll Listener (updates shared state without React re-renders) ─── */
function ScrollDriver() {
  useEffect(() => {
    const update = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = Math.max(0, Math.min(1, y / max));
      scrollState.progress = p;
      scrollState.draw = mapRange(0, 0.3, p);
      scrollState.spin = mapRange(0.3, 0.5, p);
      scrollState.slash = mapRange(0.5, 0.65, p);
      scrollState.end = mapRange(0.65, 1, p);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);
  return null;
}

export default function HeroCanvas() {
  return (
    <div className="w-full h-full">
      <ScrollDriver />
      <Canvas
        camera={{ position: [0, 0.1, 4], fov: 35 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ background: "transparent" }}
      >
        {/* Dramatic lighting */}
        <ambientLight intensity={0.12} />
        <directionalLight position={[3, 5, 5]} intensity={2} color="#f0f4f8" />
        <directionalLight position={[-4, 3, 3]} intensity={0.4} color="#e8ecf0" />
        <spotLight position={[0, 2, 6]} intensity={1.2} angle={0.25} penumbra={0.6} color="#ffffff" />
        <pointLight position={[0, -2, -2]} intensity={0.1} color="#fef3c7" distance={8} />

        <DustParticles />
        <KatanaAssembly />
        <SlashStreak />
        <SlashParticles />

        {/* Post-processing bloom */}
        <EffectComposer>
          <Bloom
            intensity={0.4}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
