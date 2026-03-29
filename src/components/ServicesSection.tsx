import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Flame, Shield, Users, Trophy } from "lucide-react";

const services = [
  { icon: Flame, title: "Kata Training", desc: "Perfect your form through precise, powerful kata sequences passed down through generations." },
  { icon: Shield, title: "Kumite Sparring", desc: "Develop timing, reflexes, and tactical awareness in controlled combat sessions." },
  { icon: Users, title: "Youth Programs", desc: "Build discipline, confidence, and respect in young martial artists ages 5–50." },
  { icon: Trophy, title: "Competition Prep", desc: "Elite training for tournament fighters seeking regional and national titles." },
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
    <section id="services" className="section-padding" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <p className="text-sm uppercase tracking-[0.3em] text-primary mb-3 font-body">Training Programs</p>
          <h2 className="font-display font-bold text-4xl md:text-5xl">
            Our <span className="glow-text">Disciplines</span>
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
