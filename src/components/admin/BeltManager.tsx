import { useEffect, useState } from "react";
import { Plus, Trash2, Save, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBelts, BeltRow } from "@/lib/beltsApi";
import { toast } from "sonner";

export default function BeltManager() {
  const { user, role } = useAuth();
  const [belts, setBelts] = useState<BeltRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [drafts, setDrafts] = useState<Record<string, Partial<BeltRow>>>({});
  const [creating, setCreating] = useState({ name: "", xp_required: 1000, color: "#3b82f6" });

  const load = async () => {
    const [b, { data: pr }] = await Promise.all([
      fetchBelts(),
      supabase.from("user_progress").select("current_belt_id"),
    ]);
    setBelts(b);
    const c: Record<string, number> = {};
    (pr ?? []).forEach((r: any) => {
      if (r.current_belt_id) c[r.current_belt_id] = (c[r.current_belt_id] ?? 0) + 1;
    });
    setCounts(c);
  };

  useEffect(() => {
    if (role !== "admin") return;
    load();
    const ch = supabase
      .channel("belt-manager")
      .on("postgres_changes", { event: "*", schema: "public", table: "belts" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_progress" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [role]);

  const setDraft = (id: string, patch: Partial<BeltRow>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  const log = async (action: "add" | "edit" | "delete" | "reorder", oldV: any, newV: any, affected = 0) => {
    if (!user) return;
    await supabase.from("belt_change_log").insert({
      admin_id: user.id,
      action_type: action,
      old_value: oldV,
      new_value: newV,
      affected_users_count: affected,
    });
  };

  const saveBelt = async (b: BeltRow) => {
    const draft = drafts[b.id];
    if (!draft) return;
    const updated = { ...b, ...draft };
    const { error } = await supabase
      .from("belts")
      .update({
        name: updated.name,
        xp_required: updated.xp_required,
        color: updated.color,
        is_active: updated.is_active,
      })
      .eq("id", b.id);
    if (error) { toast.error(error.message); return; }
    await log("edit", b, updated);
    setDrafts((d) => { const n = { ...d }; delete n[b.id]; return n; });
    toast.success("Belt updated");
  };

  const addBelt = async () => {
    if (!creating.name.trim()) { toast.error("Name required"); return; }
    const nextOrder = (belts.at(-1)?.order_index ?? 0) + 1;
    const { data, error } = await supabase
      .from("belts")
      .insert({ ...creating, order_index: nextOrder })
      .select()
      .single();
    if (error) { toast.error(error.message); return; }
    await log("add", null, data);
    setCreating({ name: "", xp_required: 1000, color: "#3b82f6" });
    toast.success("Belt added");
  };

  const deleteBelt = async (b: BeltRow) => {
    const affected = counts[b.id] ?? 0;
    if (!confirm(`Delete "${b.name}"? ${affected} user(s) will move to the previous belt.`)) return;
    const { data, error } = await supabase.rpc("delete_belt_safe", { _belt_id: b.id });
    if (error) { toast.error(error.message); return; }
    await log("delete", b, null, (data as number) ?? affected);
    toast.success("Belt deleted");
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= belts.length) return;
    const ids = [...belts].map((b) => b.id);
    [ids[idx], ids[target]] = [ids[target], ids[idx]];
    const { error } = await supabase.rpc("reorder_belts", { _ids: ids });
    if (error) { toast.error(error.message); return; }
    await log("reorder", { ids: belts.map((b) => b.id) }, { ids });
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <h3 className="font-display text-lg mb-4 text-black">Add new belt</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          <input
            value={creating.name}
            onChange={(e) => setCreating({ ...creating, name: e.target.value })}
            placeholder="Belt name"
            className="bg-secondary border border-border rounded-lg px-3 py-2 font-body text-black"
          />
          <input
            type="number"
            min="0"
            value={creating.xp_required}
            onChange={(e) => setCreating({ ...creating, xp_required: parseInt(e.target.value) || 0 })}
            placeholder="XP required"
            className="bg-secondary border border-border rounded-lg px-3 py-2 font-body text-black"
          />
          <div className="flex items-center gap-2 bg-secondary border border-border rounded-lg px-3 py-2">
            <input
              type="color"
              value={creating.color}
              onChange={(e) => setCreating({ ...creating, color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
            />
            <span className="text-xs font-body text-muted-foreground">{creating.color}</span>
          </div>
          <button onClick={addBelt} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm flex items-center justify-center gap-1">
            <Plus className="w-4 h-4" /> Add Belt
          </button>
        </div>
      </div>

      <div className="glass-card p-6 overflow-x-auto">
        <h3 className="font-display text-lg mb-4 text-black">Belts ({belts.length})</h3>
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Color</th>
              <th className="py-2 pr-2 ">Name</th>
              <th className="py-2 pr-2 ">XP Required</th>
              <th className="py-2 pr-2 ">Active</th>
              <th className="py-2 pr-2 ">Users</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {belts.map((b, i) => {
              const d = { ...b, ...(drafts[b.id] ?? {}) };
              const dirty = !!drafts[b.id];
              return (
                <tr key={b.id} className="border-b border-border/50">
                  <td className="py-3 pr-2 text-muted-foreground">{b.order_index}</td>
                  <td className="py-3 pr-2">
                    <input
                      type="color"
                      value={d.color}
                      onChange={(e) => setDraft(b.id, { color: e.target.value })}
                      className="w-9 h-9 rounded border border-border cursor-pointer bg-transparent"
                    />
                  </td>
                  <td className="py-3 pr-2">
                    <input
                      value={d.name}
                      onChange={(e) => setDraft(b.id, { name: e.target.value })}
                      className="bg-secondary border border-border rounded px-2 py-1 w-full min-w-[120px] text-black"
                    />
                  </td>
                  <td className="py-3 pr-2">
                    <input
                      type="number"
                      min="0"
                      value={d.xp_required}
                      onChange={(e) => setDraft(b.id, { xp_required: parseInt(e.target.value) || 0 })}
                      className="bg-secondary border border-border rounded px-2 py-1 w-24 text-black"
                    />
                  </td>
                  <td className="py-3 pr-2">
                    <button
                      onClick={() => setDraft(b.id, { is_active: !d.is_active })}
                      className={`px-2 py-1 rounded text-xs ${d.is_active ? "bg-green-600 text-black" : "bg-muted text-muted-foreground"}`}
                    >
                      {d.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="py-3 pr-2 text-black">{counts[b.id] ?? 0}</td>
                  <td className="py-3">
                    <div className="flex gap-1">
                      <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 bg-secondary hover:bg-secondary/70 rounded disabled:opacity-30">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => move(i, 1)} disabled={i === belts.length - 1} className="p-1.5 bg-secondary hover:bg-secondary/70 rounded disabled:opacity-30">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => saveBelt(b)}
                        disabled={!dirty}
                        className="p-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded disabled:opacity-30"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteBelt(b)} className="p-1.5 bg-destructive/15 hover:bg-destructive/25 text-destructive rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {belts.length === 0 && (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No belts yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
