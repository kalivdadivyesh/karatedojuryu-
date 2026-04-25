-- Remove class_time from upcoming_classes table
ALTER TABLE public.upcoming_classes
DROP COLUMN class_time;

-- Drop the unique constraint on class_date + class_time
ALTER TABLE public.upcoming_classes
DROP CONSTRAINT upcoming_classes_date_time_unique;

-- Add back the unique constraint on class_date only
ALTER TABLE public.upcoming_classes
ADD CONSTRAINT upcoming_classes_class_date_key UNIQUE (class_date);

-- Update RLS policies if needed (keeping existing policies active)
ALTER TABLE public.upcoming_classes ENABLE ROW LEVEL SECURITY;