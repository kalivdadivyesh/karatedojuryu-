import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const links = ["Home", "Programs", "About", "Contact"];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const scrollTo = (id: string) => {
    const map: Record<string, string> = { home: "home", programs: "services", about: "about", contact: "contact" };
    const el = document.getElementById(map[id.toLowerCase()] || id.toLowerCase());
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "glass-card border-b border-border/30" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 py-4">
        <span className="font-display font-bold text-xl glow-text cursor-pointer tracking-widest" onClick={() => scrollTo("home")}>
          武道 BUSHIDO
        </span>
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <button
              key={link}
              onClick={() => scrollTo(link.toLowerCase())}
              className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              {link}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
            </button>
          ))}
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            <button className="glow-button text-sm !px-5 !py-2" onClick={() => navigate(role === "admin" ? "/admin" : "/dashboard")}>
              Dashboard
            </button>
            <button className="text-sm font-body text-muted-foreground hover:text-foreground px-3 py-2" onClick={async () => { await signOut(); }}>
              Logout
            </button>
          </div>
        ) : (
          <button className="glow-button text-sm !px-5 !py-2" onClick={() => navigate("/login")}>Login / Sign Up</button>
        )}
      </div>
    </motion.nav>
  );
}
