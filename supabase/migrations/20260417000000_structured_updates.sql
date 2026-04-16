
-- 1. Ensure the app_role enum has 'student' instead of 'user' if possible, 
-- but for compatibility with existing data, we might just use 'student' as a text or add to enum.
-- The existing enum is ('admin', 'user'). Let's add 'student'.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'student';

-- 2. Update users table to match requested structure
-- id (uuid, primary key, linked to auth.users) - already exists as 'id' or 'auth_id'
-- The current 'id' is a random uuid, 'auth_id' links to auth.users.
-- The request says "id (uuid, primary key, linked to auth.users)".
-- We will keep 'id' as the internal PK and 'auth_id' as the link to auth.users for consistency with current code,
-- or we can align 'id' to be the auth.uid(). Let's stick to the current working 'auth_id' link but ensure 'role' and 'belt_level' are correct.

-- Add 'code' column if not exists (mapping from hex_id)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;
UPDATE public.users SET code = hex_id WHERE code IS NULL;

-- Ensure 'role' is handled. We have a 'user_roles' table currently.
-- The request suggests a 'role' column in 'users' table.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- Sync roles from user_roles table to users.role column
UPDATE public.users u
SET role = (
  SELECT CASE WHEN ur.role = 'admin' THEN 'admin' ELSE 'student' END
  FROM public.user_roles ur
  WHERE ur.user_id = u.id
  LIMIT 1
);

-- 3. Create attendance table (as requested, though attendance_records exists)
-- The request asks for: id (uuid), user_id (uuid, foreign key -> users.id), date (date), status (text)
-- This matches our 'attendance_records' table. We will ensure it's named 'attendance' or keep 'attendance_records'.
-- To follow the prompt strictly, let's ensure 'attendance' table exists with this structure.
-- We already have a legacy 'attendance' table with JSONB. Let's rename it to 'attendance_legacy' and create the new one.
ALTER TABLE IF EXISTS public.attendance RENAME TO attendance_legacy;
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'present', -- 'present' / 'absent'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Migrate data from attendance_records if any
INSERT INTO public.attendance (id, user_id, date, status, created_at)
SELECT id, user_id, date, status, created_at FROM public.attendance_records
ON CONFLICT (id) DO NOTHING;

-- 4. Create belt_history table (Optional but useful)
CREATE TABLE IF NOT EXISTS public.belt_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  belt_level TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.belt_history ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Students can only see their data" ON public.users;
DROP POLICY IF EXISTS "Admin can see everything" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can update users" ON public.users;

-- Users Policies
CREATE POLICY "Students can only see their data"
ON public.users FOR SELECT
TO authenticated
USING (auth_id = auth.uid());

CREATE POLICY "Admin can see everything"
ON public.users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.auth_id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admin can update everything"
ON public.users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.auth_id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Attendance Policies
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admin can manage attendance" ON public.attendance;

CREATE POLICY "Students can view own attendance"
ON public.attendance FOR SELECT
TO authenticated
USING (
  user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

CREATE POLICY "Admin can manage attendance"
ON public.attendance FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.auth_id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Belt History Policies
CREATE POLICY "Users can view own belt history"
ON public.belt_history FOR SELECT
TO authenticated
USING (
  user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

CREATE POLICY "Admin can manage belt history"
ON public.belt_history FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.auth_id = auth.uid()
    AND users.role = 'admin'
  )
);
