import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) navigate("/auth");
  }, [user, isLoading, navigate]);

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-3xl font-bold glow-text mb-1">Welcome, {user.name}</h1>
          <p className="text-muted-foreground font-body text-sm">
            ID: <span className="text-accent font-mono">{user.hex_id}</span>
          </p>
        </motion.div>

        <div className="grid gap-6">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate("/attendance")}
            className="glass-card p-6 text-left hover:border-primary/40 transition-all group cursor-pointer"
          >
            <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
              📅 See Attendance
            </h2>
            <p className="text-muted-foreground text-sm font-body mt-1">View your attended dates and upcoming classes</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate("/progress")}
            className="glass-card p-6 text-left hover:border-primary/40 transition-all group cursor-pointer"
          >
            <h2 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
              🥋 See Progress
            </h2>
            <p className="text-muted-foreground text-sm font-body mt-1">Check your current belt level</p>
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center"
        >
          <button
            onClick={() => { logout(); navigate("/auth"); }}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors font-body"
          >
            Logout
          </button>
        </motion.div>
      </div>
    </div>
  );
}
