-- Restore class_time column to upcoming_classes table
-- This migration adds back the time feature for scheduling classes

-- First, check if the column doesn't exist and add it
ALTER TABLE public.upcoming_classes
ADD COLUMN IF NOT EXISTS class_time TIME NOT NULL DEFAULT '18:00';

-- Remove old unique constraint on just class_date if it exists
ALTER TABLE public.upcoming_classes
DROP CONSTRAINT IF EXISTS upcoming_classes_class_date_key;

-- Add new unique constraint on class_date + class_time combination
ALTER TABLE public.upcoming_classes
ADD CONSTRAINT upcoming_classes_date_time_unique UNIQUE (class_date, class_time);

-- Update RLS policies
ALTER TABLE public.upcoming_classes ENABLE ROW LEVEL SECURITY;
