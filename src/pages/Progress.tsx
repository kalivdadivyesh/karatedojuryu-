import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const BELTS = [
  { name: "white", color: "bg-white", text: "text-black" },
  { name: "yellow", color: "bg-yellow-400", text: "text-black" },
  { name: "green", color: "bg-green-500", text: "text-white" },
  { name: "blue", color: "bg-blue-500", text: "text-white" },
  { name: "black", color: "bg-black border border-white/20", text: "text-white" },
];

export default function Progress() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [beltLevel, setBeltLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!user) return;

    const fetchProgress = async () => {
      // Fetch belt_level from users table directly
      const { data, error } = await supabase
        .from("users")
        .select("belt_level")
        .eq("auth_id", user.id)
        .single();

      if (error) setError(error.message);
      else setBeltLevel(data?.belt_level || "white");
      setLoading(false);
    };

    fetchProgress();
  }, [user, authLoading, navigate]);

  if (authLoading || !user) return null;

  const currentIndex = BELTS.findIndex((b) => b.name.toLowerCase() === beltLevel.toLowerCase());

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body mb-6 inline-block"
        >
          ← Back to Dashboard
        </button>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-3xl font-bold glow-text mb-8"
        >
          🥋 Progress
        </motion.h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-destructive font-body">{error}</p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <h2 className="font-display text-lg font-semibold text-foreground mb-6 text-center">
              Current Belt Level
            </h2>

            <div className="flex flex-col items-center gap-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className={`w-48 h-12 rounded-lg ${BELTS[currentIndex]?.color} ${BELTS[currentIndex]?.text} flex items-center justify-center font-display font-bold text-xl shadow-lg`}
              >
                <span className="capitalize">{beltLevel}</span> &nbsp;Belt
              </motion.div>

              <div className="w-full mt-4">
                <div className="flex justify-between mb-2">
                  {BELTS.map((belt, i) => (
                    <div key={belt.name} className="flex flex-col items-center gap-1">
                      <div
                        className={`w-6 h-3 rounded-sm ${belt.color} ${
                          i <= currentIndex ? "opacity-100" : "opacity-30"
                        }`}
                      />
                      <span className={`text-[10px] font-body ${
                        i <= currentIndex ? "text-foreground" : "text-muted-foreground"
                      }`}>
                        <span className="capitalize">{belt.name}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / BELTS.length) * 100}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-2 rounded-full"
                    style={{ background: "var(--gradient-primary)" }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
