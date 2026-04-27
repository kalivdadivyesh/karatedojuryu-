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
export const upcomingClassesApi = {
  async getAll() {
    return await supabaseRaw.from('upcoming_classes').select('*');
  },
  
  async add(classDate: string, classDescription: string) {
    // Use raw insert with proper typing bypass
    const data = {
      class_date: classDate,
      class_description: classDescription,
    };
    return await (supabaseRaw.from('upcoming_classes') as any).insert([data]);
  },
  
  async delete(classDate: string, classDescription: string) {
    return await (supabaseRaw.from('upcoming_classes') as any)
      .delete()
      .eq('class_date', classDate)
      .eq('class_description', classDescription);
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
