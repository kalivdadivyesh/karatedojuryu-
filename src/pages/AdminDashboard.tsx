import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Trash2, Edit, Calendar as CalIcon, Plus, Home, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBelts, BeltRow } from "@/lib/beltsApi";
import BeltManager from "@/components/admin/BeltManager";
import { toast } from "sonner";

interface UserRow {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  belt_level: string;
  is_restricted: boolean;
  hex_code: string;
}

interface ProgressRow {
  user_id: string;
  total_xp: number;
  current_belt_id: string | null;
  current_xp_in_belt: number;
}

const todayStr = () => new Date().toISOString().split("T")[0];

export default function AdminDashboard() {
  const { user, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [progress, setProgress] = useState<Record<string, ProgressRow>>({});
  const [belts, setBelts] = useState<BeltRow[]>([]);
  const [attendance, setAttendance] = useState<Record<string, Record<string, "present" | "absent">>>({});
  const [classes, setClasses] = useState<string[]>([]);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [xpEditing, setXpEditing] = useState<UserRow | null>(null);
  const [xpDelta, setXpDelta] = useState<string>("");
  const [newClassDate, setNewClassDate] = useState("");
  const [attDate, setAttDate] = useState(todayStr());

  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/login");
      else if (role && role !== "admin") navigate("/dashboard");
    }
  }, [user, role, loading, navigate]);

  const load = async () => {
    const [{ data: u }, { data: a }, { data: c }, b, { data: pr }] = await Promise.all([
      supabase.from("users").select("*").order("created_at", { ascending: false }),
      supabase.from("attendance_records").select("user_id, date, status"),
      supabase.from("upcoming_classes").select("class_date").order("class_date"),
      fetchBelts(),
      supabase.from("user_progress").select("*"),
    ]);
    if (u) setUsers(u as UserRow[]);
    if (a) {
      const map: Record<string, Record<string, "present" | "absent">> = {};
      a.forEach((r: any) => {
        if (!map[r.user_id]) map[r.user_id] = {};
        map[r.user_id][r.date] = r.status;
      });
      setAttendance(map);
    }
    if (c) setClasses(c.map((x: any) => x.class_date));
    setBelts(b);
    if (pr) {
      const m: Record<string, ProgressRow> = {};
      (pr as ProgressRow[]).forEach((p) => { m[p.user_id] = p; });
      setProgress(m);
    }
  };

  useEffect(() => {
    if (role !== "admin") return;
    load();
    const ch = supabase
      .channel("admin-dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance_records" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "upcoming_classes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "belts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_progress" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [role]);

  const markAttendance = async (uid: string, status: "present" | "absent") => {
    const { error } = await supabase
      .from("attendance_records")
      .upsert({ user_id: uid, date: attDate, status }, { onConflict: "user_id,date" });
    if (error) toast.error(error.message); else toast.success(`Marked ${status}`);
  };

  const removeAttendance = async (uid: string) => {
    const { error } = await supabase.from("attendance_records").delete().eq("user_id", uid).eq("date", attDate);
    if (error) toast.error(error.message);
  };

  const updateUser = async (u: UserRow) => {
    const { error } = await supabase
      .from("users")
      .update({ name: u.name, username: u.username, email: u.email, phone: u.phone, belt_level: u.belt_level })
      .eq("id", u.id);
    if (error) toast.error(error.message);
    else { toast.success("Updated"); setEditing(null); }
  };

  const toggleRestrict = async (u: UserRow) => {
    const { error } = await supabase.from("users").update({ is_restricted: !u.is_restricted }).eq("id", u.id);
    if (error) toast.error(error.message);
    else toast.success(u.is_restricted ? "User unrestricted" : "User restricted");
  };

  const deleteUser = async (uid: string) => {
    if (!confirm("Delete this user permanently?")) return;
    const { error } = await supabase.from("users").delete().eq("id", uid);
    if (error) toast.error(error.message); else toast.success("Deleted");
  };

  const addClass = async () => {
    if (!newClassDate) return;
    const { error } = await supabase.from("upcoming_classes").insert({ class_date: newClassDate });
    if (error) toast.error(error.message);
    else { toast.success("Class added"); setNewClassDate(""); }
  };

  const removeClass = async (d: string) => {
    const { error } = await supabase.from("upcoming_classes").delete().eq("class_date", d);
    if (error) toast.error(error.message);
  };

  const applyXp = async (target: UserRow, delta: number) => {
    const cur = progress[target.id];
    if (!cur) {
      // create row first
      const firstBelt = belts.find((b) => b.is_active);
      const { error } = await supabase.from("user_progress").insert({
        user_id: target.id,
        total_xp: Math.max(delta, 0),
        current_belt_id: firstBelt?.id ?? null,
        current_xp_in_belt: Math.max(delta, 0),
      });
      if (error) { toast.error(error.message); return; }
    } else {
      const newTotal = Math.max(cur.total_xp + delta, 0);
      const newInBelt = Math.max(cur.current_xp_in_belt + delta, 0);
      const { error } = await supabase
        .from("user_progress")
        .update({ total_xp: newTotal, current_xp_in_belt: newInBelt })
        .eq("user_id", target.id);
      if (error) { toast.error(error.message); return; }
    }
    toast.success(`XP ${delta >= 0 ? "+" : ""}${delta} applied`);
  };

  const submitXp = async (sign: 1 | -1) => {
    if (!xpEditing) return;
    const n = parseInt(xpDelta, 10);
    if (isNaN(n) || n <= 0) { toast.error("Enter a positive number"); return; }
    await applyXp(xpEditing, sign * n);
    setXpDelta("");
    setXpEditing(null);
  };

  if (loading || role !== "admin") {
    return <div className="theme-sober min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  }

  const beltById = (id: string | null) => belts.find((b) => b.id === id);

  return (
    <div className="theme-sober min-h-screen bg-background px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold glow-text">Admin · 道場</h1>
            <p className="text-muted-foreground font-body mt-1">Manage warriors</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/70 rounded-lg font-body text-sm">
              <Home className="w-4 h-4" /> Home
            </button>
            <button onClick={async () => { await signOut(); navigate("/login"); }} className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/70 rounded-lg font-body text-sm">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        <div className="glass-card p-6 mb-6">
          <h2 className="font-display text-xl mb-4 flex items-center gap-2"><CalIcon className="w-5 h-5" /> Upcoming Classes</h2>
          <div className="flex gap-2 mb-3">
            <input type="date" value={newClassDate} onChange={(e) => setNewClassDate(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-body" />
            <button onClick={addClass} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {classes.map((d) => (
              <span key={d} className="px-3 py-1 bg-secondary rounded-full text-sm font-body flex items-center gap-2">
                {d}
                <button onClick={() => removeClass(d)} className="text-destructive hover:opacity-70">×</button>
              </span>
            ))}
            {classes.length === 0 && <p className="text-muted-foreground text-sm font-body">No upcoming classes</p>}
          </div>
        </div>

        <div className="glass-card p-6 mb-6">
          <h2 className="font-display text-xl mb-4">Mark Attendance For:</h2>
          <input type="date" value={attDate} onChange={(e) => setAttDate(e.target.value)} className="bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-body" />
        </div>

        <div className="glass-card p-6 overflow-x-auto">
          <h2 className="font-display text-xl mb-4">Users ({users.length})</h2>
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Username</th>
                <th className="py-2 pr-3">Belt</th>
                <th className="py-2 pr-3">XP</th>
                <th className="py-2 pr-3">{attDate}</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const todayStatus = attendance[u.id]?.[attDate];
                const pr = progress[u.id];
                const belt = beltById(pr?.current_belt_id ?? null);
                return (
                  <tr key={u.id} className="border-b border-border/50">
                    <td className="py-3 pr-3">{u.name}</td>
                    <td className="py-3 pr-3 text-muted-foreground">@{u.username}</td>
                    <td className="py-3 pr-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: belt?.color ?? "#ccc" }} />
                        {belt?.name ?? "—"}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{pr?.total_xp ?? 0}</span>
                        <button
                          onClick={() => { setXpEditing(u); setXpDelta(""); }}
                          className="px-2 py-1 rounded text-xs bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          Edit
                        </button>
                      </div>
                      {belt && (
                        <div className="text-xs text-muted-foreground">
                          {pr?.current_xp_in_belt ?? 0} / {belt.xp_required}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <div className="flex gap-1">
                        <button onClick={() => markAttendance(u.id, "present")} className={`px-2 py-1 rounded text-xs ${todayStatus === "present" ? "bg-green-600 text-white" : "bg-secondary"}`}>P</button>
                        <button onClick={() => markAttendance(u.id, "absent")} className={`px-2 py-1 rounded text-xs ${todayStatus === "absent" ? "bg-destructive text-white" : "bg-secondary"}`}>A</button>
                        {todayStatus && <button onClick={() => removeAttendance(u.id)} className="px-2 py-1 rounded text-xs bg-secondary">×</button>}
                      </div>
                    </td>
                    <td className="py-3 pr-3">
                      <button onClick={() => toggleRestrict(u)} className={`px-2 py-1 rounded text-xs ${u.is_restricted ? "bg-destructive text-white" : "bg-green-600 text-white"}`}>
                        {u.is_restricted ? "Restricted" : "Active"}
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setEditing(u)} className="p-1.5 bg-secondary hover:bg-secondary/70 rounded"><Edit className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteUser(u.id)} className="p-1.5 bg-destructive/15 hover:bg-destructive/25 text-destructive rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No users yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8">
          <h2 className="font-display text-2xl mb-4">Belt Changes</h2>
          <p className="text-muted-foreground font-body text-sm mb-4">
            Manage the belt structure — changes apply live to all users.
          </p>
          <BeltManager />
        </div>


        {editing && (
          <div className="fixed inset-0 bg-foreground/30 flex items-center justify-center p-4 z-50" onClick={() => setEditing(null)}>
            <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-display text-xl mb-4">Edit {editing.name}</h3>
              <div className="space-y-3">
                {(["name", "username", "email", "phone"] as const).map((f) => (
                  <div key={f}>
                    <label className="text-xs text-muted-foreground capitalize block mb-1">{f}</label>
                    <input
                      value={editing[f]}
                      onChange={(e) => setEditing({ ...editing, [f]: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-body"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Belt</label>
                  <select
                    value={editing.belt_level}
                    onChange={(e) => setEditing({ ...editing, belt_level: e.target.value })}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-body"
                  >
                    {belts.map((b) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => updateUser(editing)} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm">Save</button>
                <button onClick={() => setEditing(null)} className="flex-1 px-4 py-2 bg-secondary rounded-lg font-body text-sm">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {xpEditing && (
          <div className="fixed inset-0 bg-foreground/30 flex items-center justify-center p-4 z-50" onClick={() => setXpEditing(null)}>
            <div className="glass-card p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-display text-xl mb-2">Adjust XP</h3>
              <p className="text-sm text-muted-foreground mb-4">{xpEditing.name} · current {progress[xpEditing.id]?.total_xp ?? 0} XP</p>
              <input
                type="number"
                min="1"
                value={xpDelta}
                onChange={(e) => setXpDelta(e.target.value)}
                placeholder="Amount"
                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-body mb-4"
              />
              <div className="flex gap-2">
                <button onClick={() => submitXp(1)} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm flex items-center justify-center gap-1">
                  <Plus className="w-4 h-4" /> Add XP
                </button>
                <button onClick={() => submitXp(-1)} className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-body text-sm flex items-center justify-center gap-1">
                  <Minus className="w-4 h-4" /> Remove
                </button>
              </div>
              <button onClick={() => setXpEditing(null)} className="w-full mt-2 px-4 py-2 bg-secondary rounded-lg font-body text-sm">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
