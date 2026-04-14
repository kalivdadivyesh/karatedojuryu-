import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Attendance() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) { navigate("/auth"); return; }
    if (!user) return;

    const fetchAttendance = async () => {
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_hex_id", user.hex_id)
        .maybeSingle();

      if (error) setError(error.message);
      else setAttendance(data);
      setLoading(false);
    };

    fetchAttendance();
  }, [user, isLoading, navigate]);

  if (isLoading || !user) return null;

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
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6"
            >
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">Attended Dates</h2>
              {attendance?.attended_dates?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(attendance.attended_dates as string[]).map((date: string, i: number) => (
                    <div key={i} className="bg-secondary/50 rounded-lg px-3 py-2 text-sm text-foreground font-body text-center">
                      {date}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm font-body">No attendance records yet</p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6"
            >
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">Upcoming Classes</h2>
              {attendance?.upcoming_classes?.length > 0 ? (
                <div className="space-y-2">
                  {(attendance.upcoming_classes as any[]).map((cls: any, i: number) => (
                    <div key={i} className="bg-secondary/50 rounded-lg px-4 py-3 text-sm text-foreground font-body">
                      {typeof cls === "string" ? cls : JSON.stringify(cls)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm font-body">No upcoming classes scheduled</p>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
