import { useEffect, useState } from 'react';
import { upcomingClassesApi, UpcomingClass } from '@/integrations/supabase/client-workaround';

export function useClasses() {
  const [classes, setClasses] = useState<UpcomingClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await upcomingClassesApi.getAll();
      if (err) {
        setError(err.message);
        return;
      }
      setClasses(data as UpcomingClass[]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    fetchClasses();

    const subscription = upcomingClassesApi.subscribe(() => {
      fetchClasses();
    });

    return () => {
      if (subscription) {
        subscription.then(sub => sub.unsubscribe());
      }
    };
  }, []);

  // Add class
  const addClass = async (classDate: string, classTime: string) => {
    try {
      const { error: err } = await upcomingClassesApi.add(classDate, classTime);
      if (err) throw err;
      await fetchClasses();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add class';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Update class
  const updateClass = async (id: string, classDate: string, classTime: string) => {
    try {
      const { error: err } = await upcomingClassesApi.update(id, classDate, classTime);
      if (err) throw err;
      await fetchClasses();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update class';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Delete class
  const deleteClass = async (id: string) => {
    try {
      const { error: err } = await upcomingClassesApi.delete(id);
      if (err) throw err;
      await fetchClasses();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete class';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Delete multiple classes
  const deleteMultiple = async (ids: string[]) => {
    try {
      const { error: err } = await upcomingClassesApi.deleteMultiple(ids);
      if (err) throw err;
      await fetchClasses();
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete classes';
      setError(message);
      return { success: false, error: message };
    }
  };

  return {
    classes,
    loading,
    error,
    fetchClasses,
    addClass,
    updateClass,
    deleteClass,
    deleteMultiple,
  };
}
