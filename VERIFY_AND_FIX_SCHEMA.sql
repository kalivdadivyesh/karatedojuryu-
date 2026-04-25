-- STEP 1: Verify current database schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'upcoming_classes' AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 2: If class_time is MISSING, run this to add it
ALTER TABLE public.upcoming_classes 
ADD COLUMN IF NOT EXISTS class_time TIME NOT NULL DEFAULT '18:00';

-- STEP 3: If constraint exists, drop it
ALTER TABLE public.upcoming_classes 
DROP CONSTRAINT IF EXISTS upcoming_classes_class_date_key;

-- STEP 4: Add proper composite unique constraint
ALTER TABLE public.upcoming_classes 
ADD CONSTRAINT upcoming_classes_date_time_unique UNIQUE (class_date, class_time);

-- STEP 5: Verify final schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'upcoming_classes' AND table_schema = 'public'
ORDER BY ordinal_position;
