import { supabase } from "@/integrations/supabase/client";

export interface BeltRow {
  id: string;
  name: string;
  order_index: number;
  xp_required: number;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface UserProgressRow {
  user_id: string;
  total_xp: number;
  current_belt_id: string | null;
  current_xp_in_belt: number;
  updated_at: string;
}

export const fetchBelts = async (): Promise<BeltRow[]> => {
  const { data, error } = await supabase
    .from("belts")
    .select("*")
    .order("order_index");
  if (error) throw error;
  return (data ?? []) as BeltRow[];
};

export const fetchUserProgress = async (userId: string): Promise<UserProgressRow | null> => {
  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as UserProgressRow) ?? null;
};

/** Compute progress % within the user's current belt. */
export const computeProgress = (
  progress: UserProgressRow | null,
  belts: BeltRow[],
): { belt: BeltRow | null; percent: number; xpInBelt: number; xpRequired: number; isMax: boolean } => {
  if (!progress || belts.length === 0) {
    return { belt: null, percent: 0, xpInBelt: 0, xpRequired: 0, isMax: false };
  }
  const active = belts.filter((b) => b.is_active);
  const belt =
    active.find((b) => b.id === progress.current_belt_id) ?? active[0] ?? null;
  if (!belt) return { belt: null, percent: 0, xpInBelt: 0, xpRequired: 0, isMax: false };

  const idx = active.findIndex((b) => b.id === belt.id);
  const isMax = idx === active.length - 1;
  const xpRequired = Math.max(belt.xp_required, 1);
  const xpInBelt = Math.min(progress.current_xp_in_belt, xpRequired);
  const percent = isMax ? 100 : Math.round((xpInBelt / xpRequired) * 100);
  return { belt, percent, xpInBelt, xpRequired, isMax };
};
