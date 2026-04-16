import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    
    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  async function fetchProfile() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user?.id)
      .single();
    
    if (data) setProfile(data);
    setIsLoading(false);
  }

  if (authLoading || !user || isLoading) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="font-display text-3xl font-bold glow-text mb-1">Welcome, {profile?.name || user.name}</h1>
          <p className="text-muted-foreground font-body text-sm">
            Code: <span className="text-accent font-mono">{profile?.code || user.hex_id}</span>
          </p>
          {profile?.role === 'admin' && (
            <div className="mt-4">
              <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Admin</span>
            </div>
          )}
        </motion.div>

        <div className="grid gap-6">
          {profile?.role === 'admin' && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              onClick={() => navigate("/admin")}
              className="glass-card p-6 text-left border-primary/20 hover:border-primary/60 transition-all group cursor-pointer bg-primary/5"
            >
              <h2 className="font-display text-xl font-semibold text-primary group-hover:text-primary transition-colors">
                🛡️ Admin Panel
              </h2>
              <p className="text-muted-foreground text-sm font-body mt-1">Manage students, mark attendance, and update belts</p>
            </motion.button>
          )}

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
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-destructive transition-colors font-body"
          >
            Logout
          </button>
        </motion.div>
      </div>
    </div>
  );
}
