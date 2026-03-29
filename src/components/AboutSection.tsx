import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const stats = [
  { value: "2000+", label: "Students Trained" },
  { value: "25+", label: "Tournament Wins" },
  { value: "18", label: "Years Teaching" },
  { value: "6", label: "Black Belt Instructors" },
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
          <p className="text-sm uppercase tracking-[0.3em] text-primary mb-3 font-body">Our Dojo</p>
          <h2 className="font-display font-bold text-4xl md:text-5xl mb-6">
            Forged in <span className="glow-text">discipline</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4 font-body">
            Our dojo is more than a training ground — it's a community built on respect, perseverance, and the relentless pursuit of excellence. Every student, from white belt to black belt, is part of a legacy.
          </p>
          <p className="text-muted-foreground leading-relaxed font-body">
            Founded by Shihan Ram Gudme, 6th Dan, our programs blend traditional Shotokan/Goju-Ryu karate with modern sports science for complete martial arts development.
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
