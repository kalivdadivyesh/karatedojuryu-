import { motion } from "framer-motion";

const socials = ["Instagram", "YouTube", "Facebook", "TikTok"];
const footerLinks = ["Privacy", "Terms", "Schedule"];

export default function Footer() {
  return (
    <footer id="contact" className="border-t border-border/30 px-6 md:px-12 lg:px-24 py-16" style={{ background: "hsl(0 0% 5% / 0.55)", backdropFilter: "blur(8px)" }}>
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <span className="font-display font-bold text-xl glow-text tracking-widest">武道 BUSHIDO</span>
          <p className="text-muted-foreground text-sm mt-2 font-body">© 2026 Bushido Karate Dojo. All rights reserved.</p>
        </div>

        <div className="flex items-center gap-6">
          {footerLinks.map((link) => (
            <a key={link} href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body">
              {link}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {socials.map((s) => (
            <motion.a
              key={s}
              href="#"
              whileHover={{ y: -2 }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors font-body"
            >
              {s}
            </motion.a>
          ))}
        </div>
      </div>
    </footer>
  );
}
