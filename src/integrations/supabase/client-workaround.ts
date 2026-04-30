// Workaround client that bypasses schema cache issues
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Create client WITHOUT type checking to bypass schema cache issues
export const supabaseRaw = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Type-safe wrapper for upcoming_classes queries
export interface UpcomingClass {
  id: string;
  class_date: string;
  class_time: string;
  datetime: string;
  created_at: string;
}

export const upcomingClassesApi = {
  async getAll() {
    return await supabaseRaw
      .from('upcoming_classes')
      .select('*')
      .order('datetime', { ascending: true });
  },
  
  async add(classDate: string, classTime: string) {
    const data = {
      class_date: classDate,
      class_time: classTime,
    };
    return await (supabaseRaw.from('upcoming_classes') as any).insert([data]);
  },
  
  async update(id: string, classDate: string, classTime: string) {
    return await (supabaseRaw.from('upcoming_classes') as any)
      .update({
        class_date: classDate,
        class_time: classTime,
      })
      .eq('id', id);
  },
  
  async delete(id: string) {
    return await (supabaseRaw.from('upcoming_classes') as any)
      .delete()
      .eq('id', id);
  },

  async deleteMultiple(ids: string[]) {
    return await (supabaseRaw.from('upcoming_classes') as any)
      .delete()
      .in('id', ids);
  },

  async subscribe(callback: (data: any) => void) {
    return supabaseRaw
      .channel('upcoming-classes-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'upcoming_classes' }, 
        callback
      )
      .subscribe();
  }
};
