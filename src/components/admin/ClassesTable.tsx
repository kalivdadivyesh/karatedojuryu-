import { useState, useMemo } from 'react';
import { Edit, Trash2, AlertCircle } from 'lucide-react';
import { UpcomingClass } from '@/integrations/supabase/client-workaround';
import { toast } from 'sonner';

interface ClassesTableProps {
  classes: UpcomingClass[];
  onEdit: (classData: UpcomingClass) => void;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
  onDeleteMultiple: (ids: string[]) => Promise<{ success: boolean; error?: string }>;
  isLoading?: boolean;
}

export default function ClassesTable({
  classes,
  onEdit,
  onDelete,
  onDeleteMultiple,
  isLoading = false,
}: ClassesTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterDate, setFilterDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter classes by date
  const filteredClasses = useMemo(() => {
    if (!filterDate) return classes;
    return classes.filter((c) => c.class_date === filterDate);
  }, [classes, filterDate]);

  // Convert time to 12-hour format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredClasses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredClasses.map((c) => c.id)));
    }
  };

  const handleSelectClass = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const result = await onDelete(id);
      if (result.success) {
        toast.success('Class deleted');
        setShowDeleteConfirm(null);
      } else {
        toast.error(result.error || 'Failed to delete class');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete class');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const result = await onDeleteMultiple(Array.from(selectedIds));
      if (result.success) {
        toast.success(`Deleted ${selectedIds.size} class(es)`);
        setSelectedIds(new Set());
        setShowBulkDeleteConfirm(false);
      } else {
        toast.error(result.error || 'Failed to delete classes');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete classes');
    } finally {
      setIsDeleting(false);
    }
  };

  const hasNearClasses = filteredClasses.length > 0;

  return (
    <div className="glass-card p-6 mb-6">
      <h2 className="font-display text-xl mb-4 text-black">Classes Management</h2>

      {/* Filter Section */}
      <div className="mb-6 p-4 bg-secondary/30 rounded-lg">
        <div className="flex flex-col sm:flex-row gap-2 items-end">
          <div className="flex-1">
            <label className="block text-sm font-body text-muted-foreground mb-2">Filter by Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-foreground font-body text-sm"
            />
          </div>
          <button
            onClick={() => setFilterDate('')}
            className="px-4 py-2 bg-secondary text-foreground rounded-lg font-body text-sm hover:bg-secondary/70 transition"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between">
          <span className="text-sm font-body text-foreground">
            {selectedIds.size} class(es) selected
          </span>
          <button
            onClick={() => setShowBulkDeleteConfirm(true)}
            disabled={isDeleting}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-body text-sm hover:bg-destructive/90 disabled:opacity-50 transition"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Classes Table */}
      <div className="overflow-x-auto">
        {hasNearClasses ? (
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground text-black">
                <th className="py-3 px-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === filteredClasses.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Time</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClasses.map((classItem) => (
                <tr
                  key={classItem.id}
                  className="border-b border-border/50 hover:bg-secondary/20 transition"
                >
                  <td className="py-3 px-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(classItem.id)}
                      onChange={() => handleSelectClass(classItem.id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-3 text-black font-semibold">
                    {formatDate(classItem.class_date)}
                  </td>
                  <td className="py-3 px-3 text-black">{formatTime(classItem.class_time)}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">
                    {new Date(classItem.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onEdit(classItem)}
                        disabled={isLoading}
                        className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(classItem.id)}
                        disabled={isLoading}
                        className="p-2 rounded-lg bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-8 text-center">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-muted-foreground font-body text-sm">
              {filterDate ? 'No classes found for this date' : 'No upcoming classes yet'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-sm w-full p-6 border border-border">
            <h3 className="font-display text-lg text-black mb-2">Delete Class?</h3>
            <p className="text-muted-foreground font-body text-sm mb-6">
              This action cannot be undone. The class will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-body text-sm hover:bg-destructive/90 disabled:opacity-50 transition"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg font-body text-sm hover:bg-secondary/70 disabled:opacity-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-sm w-full p-6 border border-border">
            <h3 className="font-display text-lg text-black mb-2">Delete {selectedIds.size} Class(es)?</h3>
            <p className="text-muted-foreground font-body text-sm mb-6">
              This action cannot be undone. All selected classes will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg font-body text-sm hover:bg-destructive/90 disabled:opacity-50 transition"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete All'}
              </button>
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg font-body text-sm hover:bg-secondary/70 disabled:opacity-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
