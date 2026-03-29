import { motion } from "framer-motion";
import HeroCanvas from "./HeroCanvas";

export default function HeroSection() {
  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <HeroCanvas />

      {/* Radial glow */}
      <div className="absolute inset-0 z-[1]" style={{ background: "var(--gradient-glow)" }} />

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-6 font-body"
        >
          Creative Digital Agency
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="font-display font-extrabold text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-6"
        >
          We craft{" "}
          <span className="glow-text">digital</span>
          <br />
          experiences
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-10 font-body"
        >
          Merging design, technology, and motion to build unforgettable brands and products.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
        >
          <button className="glow-button text-base">Explore Our Work</button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-5 h-8 rounded-full border border-muted-foreground/40 flex items-start justify-center p-1">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1 h-2 rounded-full bg-primary"
          />
        </div>
      </motion.div>
    </section>
  );
}
