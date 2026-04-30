import { useState } from 'react';
import { Plus, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CreateClassProps {
  onAdd: (classDate: string, classTime: string) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

export default function CreateClass({ onAdd, isLoading = false }: CreateClassProps) {
  const [classDate, setClassDate] = useState('');
  const [classTime, setClassTime] = useState('18:00');
  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Check if date is in the future or today
    const selectedDate = new Date(classDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setValidationError('Date cannot be in the past');
      return false;
    }

    // Check if datetime is in the future (if date is today, check time)
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

  const handleAdd = async () => {
    if (!validateInputs()) return;

    setIsSubmitting(true);
    try {
      const result = await onAdd(classDate, classTime);
      if (result.success) {
        setClassDate('');
        setClassTime('18:00');
        setValidationError('');
        toast.success('Class added successfully');
      } else {
        setValidationError(result.error || 'Failed to add class');
        toast.error(result.error || 'Failed to add class');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add class';
      setValidationError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-6 mb-6">
      <h2 className="font-display text-xl mb-4 text-black">Create Class</h2>
      
      {validationError && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-destructive">{validationError}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="date"
          value={classDate}
          onChange={(e) => setClassDate(e.target.value)}
          className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-body text-sm"
          placeholder="Select date"
        />
        <input
          type="time"
          value={classTime}
          onChange={(e) => setClassTime(e.target.value)}
          className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-body text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={isSubmitting || isLoading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-body text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      <p className="text-xs text-muted-foreground font-body">
        Select date and time in 24-hour format. Classes must be scheduled for today or future dates.
      </p>
    </div>
  );
}
