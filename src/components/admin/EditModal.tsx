import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { UpcomingClass } from '@/integrations/supabase/client-workaround';

interface EditModalProps {
  isOpen: boolean;
  classData: UpcomingClass | null;
  onSave: (id: string, classDate: string, classTime: string) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function EditModal({ isOpen, classData, onSave, onCancel, isLoading = false }: EditModalProps) {
  const [classDate, setClassDate] = useState('');
  const [classTime, setClassTime] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (classData) {
      setClassDate(classData.class_date);
      setClassTime(classData.class_time);
      setValidationError('');
    }
  }, [classData, isOpen]);

  const validateInputs = () => {
    setValidationError('');

    if (!classDate) {
      setValidationError('Date is required');
      return false;
    }

    if (!classTime) {
      setValidationError('Time is required');
      return false;
    }

    const selectedDate = new Date(classDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setValidationError('Date cannot be in the past');
      return false;
    }

    if (selectedDate.getTime() === today.getTime()) {
      const [hours, minutes] = classTime.split(':').map(Number);
      const now = new Date();
      const classDateTime = new Date();
      classDateTime.setHours(hours, minutes, 0, 0);

      if (classDateTime < now) {
        setValidationError('Time cannot be in the past');
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateInputs() || !classData) return;

    setIsSubmitting(true);
    try {
      const result = await onSave(classData.id, classDate, classTime);
      if (result.success) {
        setValidationError('');
        onCancel();
      } else {
        setValidationError(result.error || 'Failed to save changes');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save changes';
      setValidationError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !classData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-md w-full p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-black">Edit Class</h2>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{validationError}</p>
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-body text-muted-foreground mb-2">Date</label>
            <input
              type="date"
              value={classDate}
              onChange={(e) => setClassDate(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-body text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-body text-muted-foreground mb-2">Time (24-hour format)</label>
            <input
              type="time"
              value={classTime}
              onChange={(e) => setClassTime(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-body text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSubmitting || isLoading}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg font-body text-sm hover:bg-secondary/70 disabled:opacity-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
