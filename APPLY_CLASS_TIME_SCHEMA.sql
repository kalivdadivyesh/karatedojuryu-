-- ============================================
-- APPLY CLASS_TIME SCHEMA TO UPCOMING_CLASSES
-- ============================================
-- Run this script in your Supabase SQL Editor

-- Step 1: Add class_time column if it doesn't exist
ALTER TABLE public.upcoming_classes 
ADD COLUMN class_time TIME NOT NULL DEFAULT '18:00';

-- Step 2: Remove the UNIQUE constraint on class_date only
ALTER TABLE public.upcoming_classes 
DROP CONSTRAINT IF EXISTS upcoming_classes_class_date_key;

-- Step 3: Add a new unique constraint on class_date + class_time combination
ALTER TABLE public.upcoming_classes 
ADD CONSTRAINT upcoming_classes_date_time_unique UNIQUE (class_date, class_time);

-- Step 4: Ensure RLS is enabled
ALTER TABLE public.upcoming_classes ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify the schema
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'upcoming_classes' AND table_schema = 'public'
ORDER BY ordinal_position;
