-- Add class_time to upcoming_classes table
ALTER TABLE public.upcoming_classes 
ADD COLUMN class_time TIME NOT NULL DEFAULT '18:00';

-- Remove the UNIQUE constraint on class_date to allow multiple classes on same day
ALTER TABLE public.upcoming_classes 
DROP CONSTRAINT upcoming_classes_class_date_key;

-- Add a new unique constraint on class_date + class_time combination
ALTER TABLE public.upcoming_classes 
ADD CONSTRAINT upcoming_classes_date_time_unique UNIQUE (class_date, class_time);

-- Update RLS policies if needed (keeping existing policies active)
ALTER TABLE public.upcoming_classes ENABLE ROW LEVEL SECURITY;
