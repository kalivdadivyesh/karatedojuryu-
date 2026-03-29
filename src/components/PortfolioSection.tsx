import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const projects = [
  { title: "Orbital Finance", category: "Web App", color: "from-glow-purple/20 to-glow-blue/20" },
  { title: "Neon Collective", category: "Branding", color: "from-glow-pink/20 to-glow-purple/20" },
  { title: "Void Studio", category: "UI/UX", color: "from-glow-blue/20 to-glow-pink/20" },
  { title: "Prism Labs", category: "Motion", color: "from-glow-purple/20 to-glow-pink/20" },
];

export default function PortfolioSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="work" className="section-padding" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-primary mb-3 font-body">Portfolio</p>
          <h2 className="font-display font-bold text-4xl md:text-5xl">
            Selected <span className="glow-text">Work</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer glass-card"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${p.color} transition-opacity group-hover:opacity-80`} />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2 font-body">{p.category}</p>
                <h3 className="font-display font-bold text-2xl md:text-3xl text-foreground group-hover:glow-text transition-all duration-300">
                  {p.title}
                </h3>
              </div>
              <div className="absolute inset-0 border border-transparent group-hover:border-primary/30 rounded-xl transition-all duration-500" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
