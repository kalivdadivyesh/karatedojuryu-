-- ============================================
-- COMPLETE CLASS_TIME SCHEMA FIX
-- ============================================
-- Run this in Supabase SQL Editor if you still get schema cache errors

-- Step 1: Drop and recreate the table with correct schema
DROP TABLE IF EXISTS public.upcoming_classes CASCADE;

-- Step 2: Create the table with class_time from the start
CREATE TABLE public.upcoming_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_date DATE NOT NULL,
  class_time TIME NOT NULL DEFAULT '18:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_date, class_time)
);

-- Step 3: Enable RLS
ALTER TABLE public.upcoming_classes ENABLE ROW LEVEL SECURITY;

-- Step 4: Recreate RLS policies
CREATE POLICY "Anyone authenticated can view classes" ON public.upcoming_classes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage classes" ON public.upcoming_classes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Step 5: Setup realtime
ALTER TABLE public.upcoming_classes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.upcoming_classes;

-- Step 6: Verify the schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'upcoming_classes' AND table_schema = 'public'
ORDER BY ordinal_position;
