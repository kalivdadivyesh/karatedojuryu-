import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import BeltProgression from "@/components/BeltProgression";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import { Belt } from "@/lib/belts";

interface Profile {
  name: string;
  username: string;
  hex_code: string;
  belt_level: Belt;
}

export default function UserDashboard() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent">>({});
  const [upcoming, setUpcoming] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: p }, { data: a }, { data: u }] = await Promise.all([
        supabase.from("users").select("name, username, hex_code, belt_level").eq("id", user.id).maybeSingle(),
        supabase.from("attendance_records").select("date, status").eq("user_id", user.id),
        supabase.from("upcoming_classes").select("class_date"),
      ]);
      if (p) setProfile(p as Profile);
      if (a) {
        const map: Record<string, "present" | "absent"> = {};
        a.forEach((r: any) => { map[r.date] = r.status; });
        setAttendance(map);
      }
      if (u) setUpcoming(new Set(u.map((c: any) => c.class_date)));
    };
    load();

    const ch = supabase
      .channel("user-dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "users", filter: `id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "upcoming_classes" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (loading || !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  }

  const handleLogout = async () => { await signOut(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold glow-text">武道 BUSHIDO</h1>
            <p className="text-muted-foreground font-body mt-1">
              Welcome, <span className="text-foreground">{profile.name}</span> ·{" "}
              <span className="text-primary">#{profile.hex_code}</span>
            </p>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary rounded-lg font-body text-sm transition">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-8">
          <h2 className="font-display text-2xl mb-4">Belt Progression</h2>
          <BeltProgression current={profile.belt_level} />
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display text-2xl mb-4">Attendance & Schedule</h2>
          <AttendanceCalendar attendance={attendance} upcoming={upcoming} />
        </motion.div>
      </div>
    </div>
  );
}
