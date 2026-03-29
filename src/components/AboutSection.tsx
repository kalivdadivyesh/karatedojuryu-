import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const stats = [
  { value: "150+", label: "Projects" },
  { value: "12", label: "Awards" },
  { value: "8+", label: "Years" },
  { value: "40+", label: "Clients" },
];

export default function AboutSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="section-padding" ref={ref}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p className="text-sm uppercase tracking-[0.3em] text-primary mb-3 font-body">About Us</p>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-6">
            Built for the <span className="glow-text">bold</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4 font-body">
            We are a collective of designers, developers, and dreamers who believe digital experiences should feel alive. Every pixel, every transition, every interaction is crafted with intention.
          </p>
          <p className="text-muted-foreground leading-relaxed font-body">
            From startups to global brands, we partner with visionaries who refuse to settle for ordinary.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-2 gap-6"
        >
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="glass-card p-6 text-center"
            >
              <div className="font-display font-extrabold text-3xl md:text-4xl glow-text mb-1">{s.value}</div>
              <div className="text-muted-foreground text-sm font-body">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
