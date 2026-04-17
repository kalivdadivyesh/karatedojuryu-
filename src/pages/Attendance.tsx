import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Attendance() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!user) return;

    const fetchProfileAndAttendance = async () => {
      // First get the internal user ID from public.users
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (profileError) {
        setError("Failed to load profile");
        setLoading(false);
        return;
      }

      // Fetch from per-date attendance_records table
      const { data, error } = await supabase
        .from("attendance_records")
        .select("*")
        .eq("user_id", profile.id)
        .order("date", { ascending: false });

      if (error) setError(error.message);
      else setRecords(data || []);
      setLoading(false);
    };

    fetchProfileAndAttendance();
  }, [user, authLoading, navigate]);

  if (authLoading || !user) return null;

  const presentCount = records.filter(r => r.status === 'present').length;
  const totalCount = records.length;

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
          📅 Attendance
        </motion.h1>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : error ? (
          <p className="text-destructive font-body">{error}</p>
        ) : (
          <div className="space-y-6">
            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <h2 className="font-display text-lg font-semibold text-foreground mb-2">Summary</h2>
              <div className="flex gap-8">
                <div>
                  <p className="text-2xl font-bold text-primary">{presentCount}</p>
                  <p className="text-xs text-muted-foreground font-body">Classes Attended</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                  <p className="text-xs text-muted-foreground font-body">Total Records</p>
                </div>
              </div>
            </motion.div>

            {/* Records */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">Attendance History</h2>
              {records.length > 0 ? (
                <div className="space-y-2">
                  {records.map((record) => (
                    <div key={record.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
                      <span className="text-sm text-foreground font-body">{record.date}</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        record.status === 'present' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {record.status === 'present' ? '✅ Present' : '❌ Absent'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm font-body">No attendance records yet. Your admin will mark your attendance.</p>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
