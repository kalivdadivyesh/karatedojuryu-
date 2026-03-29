import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export default function KatanaSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Katana entry: slide in from right
  const katanaX = useTransform(scrollYProgress, [0, 0.3], [300, 0]);
  const katanaRotate = useTransform(scrollYProgress, [0, 0.3, 0.5], [45, 0, 0]);
  const katanaOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  // Slash: rotate and move across
  const slashRotate = useTransform(scrollYProgress, [0.5, 0.7], [0, -60]);
  const slashX = useTransform(scrollYProgress, [0.5, 0.7], [0, -400]);

  // Trail effect
  const trailOpacity = useTransform(scrollYProgress, [0.5, 0.6, 0.75], [0, 1, 0]);
  const trailScaleX = useTransform(scrollYProgress, [0.5, 0.7], [0, 1.5]);

  // CTA reveal
  const ctaOpacity = useTransform(scrollYProgress, [0.7, 0.85], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.7, 0.85], [60, 0]);

  // Screen split effect
  const splitLeft = useTransform(scrollYProgress, [0.6, 0.8], [0, -30]);
  const splitRight = useTransform(scrollYProgress, [0.6, 0.8], [0, 30]);

  return (
    <section ref={sectionRef} className="relative" style={{ height: "300vh" }}>
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* Background glow */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: trailOpacity,
            background: "radial-gradient(ellipse at center, hsl(270 80% 65% / 0.1), transparent 60%)",
          }}
        />

        {/* Split overlay left */}
        <motion.div
          className="absolute top-0 left-0 w-1/2 h-full bg-background z-20 pointer-events-none"
          style={{ x: splitLeft, opacity: useTransform(scrollYProgress, [0.55, 0.65, 0.8], [0, 0.6, 0]) }}
        />
        {/* Split overlay right */}
        <motion.div
          className="absolute top-0 right-0 w-1/2 h-full bg-background z-20 pointer-events-none"
          style={{ x: splitRight, opacity: useTransform(scrollYProgress, [0.55, 0.65, 0.8], [0, 0.6, 0]) }}
        />

        {/* Katana */}
        <motion.div
          className="absolute z-30"
          style={{
            x: katanaX,
            rotate: katanaRotate,
            opacity: katanaOpacity,
          }}
        >
          <motion.div
            style={{ rotate: slashRotate, x: slashX }}
          >
            {/* Katana SVG */}
            <svg width="320" height="40" viewBox="0 0 320 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Blade */}
              <defs>
                <linearGradient id="blade-grad" x1="0" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="40%" stopColor="#f8fafc" />
                  <stop offset="60%" stopColor="#cbd5e1" />
                  <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="edge-glow" x1="0" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
                  <stop offset="50%" stopColor="#a855f7" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Blade body */}
              <polygon points="40,14 280,18 280,22 40,26" fill="url(#blade-grad)" />
              {/* Blade edge glow */}
              <line x1="40" y1="20" x2="280" y2="20" stroke="url(#edge-glow)" strokeWidth="1" filter="url(#glow)" />
              {/* Blade tip */}
              <polygon points="280,16 310,20 280,24" fill="#cbd5e1" />
              {/* Guard (tsuba) */}
              <ellipse cx="40" cy="20" rx="4" ry="10" fill="#7c3aed" stroke="#a855f7" strokeWidth="1" />
              {/* Handle */}
              <rect x="4" y="16" width="36" height="8" rx="2" fill="#1e1b2e" stroke="#4c1d95" strokeWidth="0.5" />
              {/* Handle wrap pattern */}
              {[8, 16, 24, 32].map((x) => (
                <line key={x} x1={x} y1="16" x2={x} y2="24" stroke="#7c3aed" strokeWidth="0.5" opacity="0.5" />
              ))}
              {/* Pommel */}
              <circle cx="4" cy="20" r="3" fill="#4c1d95" />
            </svg>
          </motion.div>
        </motion.div>

        {/* Light trail */}
        <motion.div
          className="absolute z-25 h-[2px] pointer-events-none"
          style={{
            width: "100vw",
            opacity: trailOpacity,
            scaleX: trailScaleX,
            background: "linear-gradient(90deg, transparent, hsl(270 80% 65%), hsl(220 90% 60%), transparent)",
            boxShadow: "0 0 30px hsl(270 80% 65% / 0.6), 0 0 60px hsl(270 80% 65% / 0.3)",
          }}
        />

        {/* CTA reveal */}
        <motion.div
          className="absolute z-40 text-center px-6"
          style={{ opacity: ctaOpacity, y: ctaY }}
        >
          <h2 className="font-display font-extrabold text-4xl md:text-6xl mb-6">
            Ready to <span className="glow-text">cut through</span> the noise?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 font-body max-w-md mx-auto">
            Let's create something that leaves a mark.
          </p>
          <button className="glow-button text-base">Start a Project</button>
        </motion.div>
      </div>
    </section>
  );
}
