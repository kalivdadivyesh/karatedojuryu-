import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Palette, Code, Layers, Sparkles } from "lucide-react";

const services = [
  { icon: Palette, title: "Brand Identity", desc: "Visual systems that resonate with your audience and stand the test of time." },
  { icon: Code, title: "Web Development", desc: "High-performance web applications built with cutting-edge technology." },
  { icon: Layers, title: "UI/UX Design", desc: "Intuitive interfaces that delight users and drive engagement." },
  { icon: Sparkles, title: "Motion Design", desc: "Cinematic animations that bring your digital presence to life." },
];

function ServiceCard({ icon: Icon, title, desc, index }: { icon: any; title: string; desc: string; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.15, duration: 0.6 }}
      className="glass-card p-8 group hover:glow-border transition-all duration-500 cursor-pointer"
    >
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="font-display font-semibold text-xl mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed font-body">{desc}</p>
    </motion.div>
  );
}

export default function ServicesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section-padding" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-primary mb-3 font-body">What We Do</p>
          <h2 className="font-display font-bold text-4xl md:text-5xl">
            Our <span className="glow-text">Services</span>
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <ServiceCard key={s.title} {...s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
