import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { upcomingClassesApi } from "@/integrations/supabase/client-workaround";
import { useAuth } from "@/contexts/AuthContext";
import DynamicBeltProgression from "@/components/DynamicBeltProgression";
import BeltProgressRing from "@/components/BeltProgressRing";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import {
  fetchBelts,
  fetchUserProgress,
  computeProgress,
  BeltRow,
  UserProgressRow,
} from "@/lib/beltsApi";

interface Profile {
  name: string;
  username: string;
  hex_code: string;
  belt_level: string;
}

export default function UserDashboard() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [belts, setBelts] = useState<BeltRow[]>([]);
  const [progress, setProgress] = useState<UserProgressRow | null>(null);
  const [attendance, setAttendance] = useState<Record<string, "present" | "absent">>({});
  const [upcoming, setUpcoming] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: p }, { data: a }, classesResult, b, pr] = await Promise.all([
        supabase.from("users").select("name, username, hex_code, belt_level").eq("id", user.id).maybeSingle(),
        supabase.from("attendance_records").select("date, status").eq("user_id", user.id),
        upcomingClassesApi.getAll(),
        fetchBelts(),
        fetchUserProgress(user.id),
      ]);
      if (p) setProfile(p as Profile);
      if (a) {
        const map: Record<string, "present" | "absent"> = {};
        a.forEach((r: any) => { map[r.date] = r.status; });
        setAttendance(map);
      }
      if (classesResult.data) setUpcoming(new Set((classesResult.data as Array<{ class_date: string }>).map(c => c.class_date)));
      setBelts(b);
      setProgress(pr);
    };
    load();

    const ch = supabase
      .channel("user-dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "users", filter: `id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records", filter: `user_id=eq.${user.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "upcoming_classes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "belts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_progress", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  if (loading || !profile) {
    return <div className="theme-sober min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  }

  const { belt, percent, xpInBelt, xpRequired, isMax } = computeProgress(progress, belts);
  const handleLogout = async () => { await signOut(); navigate("/login"); };

  return (
    <div className="theme-sober min-h-screen bg-background px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold glow-text">武道 BUSHIDO</h1>
            <p className="text-muted-foreground font-body mt-1">
              Welcome, <span className="text-foreground">{profile.name}</span> ·{" "}
              <span className="text-primary">#{profile.hex_code}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-black/70 rounded-lg font-body text-sm transition text-white">
              <Home className="w-4 h-4 text-white" /> Home
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-black/70 rounded-lg font-body text-sm transition text-white">
              <LogOut className="w-4 h-4 text-white" /> Logout
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-8 mb-8">
          <h2 className="font-display text-2xl mb-6 text-black">Your Progress</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="flex justify-center">
              <BeltProgressRing
                belt={belt}
                percent={percent}
                xpInBelt={xpInBelt}
                xpRequired={xpRequired}
                isMax={isMax}
              />
            </div>
            <div className="space-y-3 font-body">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Total XP</span>
                <span className="font-semibold">{progress?.total_xp ?? 0}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">XP in current belt</span>
                <span className="font-semibold">{xpInBelt} / {xpRequired}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-semibold">{percent}%</span>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                XP is awarded by your instructor. Keep training to advance.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <h3 className="font-display text-lg mb-3 text-black">Belt Path</h3>
            <DynamicBeltProgression belts={belts} currentBeltId={progress?.current_belt_id ?? null} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <h2 className="font-display text-2xl mb-4 text-black">Attendance & Schedule</h2>
          <AttendanceCalendar attendance={attendance} upcoming={upcoming} />
        </motion.div>
      </div>
    </div>
  );
}
