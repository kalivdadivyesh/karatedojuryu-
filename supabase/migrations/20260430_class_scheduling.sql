-- Complete Class Scheduling System
-- Restructures upcoming_classes table with proper date/time fields

-- Drop existing table and constraints
DROP TABLE IF EXISTS public.upcoming_classes CASCADE;

-- Create new upcoming_classes table
CREATE TABLE public.upcoming_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_date DATE NOT NULL,
  class_time TIME NOT NULL,
  datetime TIMESTAMP NOT NULL GENERATED ALWAYS AS (class_date::timestamp + class_time::interval) STORED,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(class_date, class_time)
);

-- Create indexes for efficient querying
CREATE INDEX idx_upcoming_classes_datetime ON public.upcoming_classes(datetime ASC);
CREATE INDEX idx_upcoming_classes_class_date ON public.upcoming_classes(class_date);

-- Enable RLS
ALTER TABLE public.upcoming_classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow public read, authenticated admin write)
CREATE POLICY "Allow public read" ON public.upcoming_classes
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated admin insert" ON public.upcoming_classes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow authenticated admin update" ON public.upcoming_classes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Allow authenticated admin delete" ON public.upcoming_classes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
