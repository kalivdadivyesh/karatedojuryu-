-- Replace class_time with class_description in upcoming_classes table
-- This allows admin to add descriptions for scheduled classes

-- First, drop the old constraint that uses class_time
ALTER TABLE public.upcoming_classes
DROP CONSTRAINT IF EXISTS upcoming_classes_date_time_unique;

-- Drop the class_time column
ALTER TABLE public.upcoming_classes
DROP COLUMN IF EXISTS class_time;

-- Add the new class_description column
ALTER TABLE public.upcoming_classes
ADD COLUMN IF NOT EXISTS class_description TEXT DEFAULT '';

-- Add new unique constraint on class_date + class_description combination
ALTER TABLE public.upcoming_classes
ADD CONSTRAINT upcoming_classes_date_desc_unique UNIQUE (class_date, class_description);

-- Update RLS policies
ALTER TABLE public.upcoming_classes ENABLE ROW LEVEL SECURITY;
