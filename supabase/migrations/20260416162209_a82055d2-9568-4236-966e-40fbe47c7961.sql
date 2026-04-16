
-- 1. Add auth_id and belt_level to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS belt_level TEXT NOT NULL DEFAULT 'White';

-- Copy belt levels from progress table to users
UPDATE public.users u
SET belt_level = p.belt_level
FROM public.progress p
WHERE p.user_hex_id = u.hex_id;

-- 2. Create new attendance_records table (per-date records)
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'present',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- 3. Create security definer function for role checks
CREATE OR REPLACE FUNCTION public.get_user_role(_auth_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role::text
  FROM public.user_roles ur
  JOIN public.users u ON u.id = ur.user_id
  WHERE u.auth_id = _auth_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_id_from_auth(_auth_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.users WHERE auth_id = _auth_id LIMIT 1;
$$;

-- 4. Drop old open RLS policies on users
DROP POLICY IF EXISTS "Users insertable" ON public.users;
DROP POLICY IF EXISTS "Users readable" ON public.users;

-- New users policies
CREATE POLICY "Users can read own profile"
ON public.users FOR SELECT
TO authenticated
USING (auth_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Service role can insert users"
ON public.users FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Admin can update users"
ON public.users FOR UPDATE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- 5. Drop old open RLS policies on attendance
DROP POLICY IF EXISTS "Attendance insertable" ON public.attendance;
DROP POLICY IF EXISTS "Attendance readable" ON public.attendance;
DROP POLICY IF EXISTS "Attendance updatable" ON public.attendance;

-- New attendance policies (legacy table - admin only now)
CREATE POLICY "Admin can manage attendance"
ON public.attendance FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- 6. Attendance_records policies
CREATE POLICY "Students can view own attendance"
ON public.attendance_records FOR SELECT
TO authenticated
USING (user_id = public.get_user_id_from_auth(auth.uid()) OR public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin can insert attendance"
ON public.attendance_records FOR INSERT
TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin can update attendance"
ON public.attendance_records FOR UPDATE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin can delete attendance"
ON public.attendance_records FOR DELETE
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- 7. Drop old progress policies
DROP POLICY IF EXISTS "Progress insertable" ON public.progress;
DROP POLICY IF EXISTS "Progress readable" ON public.progress;
DROP POLICY IF EXISTS "Progress updatable" ON public.progress;

-- New progress policies (keep for history, admin only)
CREATE POLICY "Progress readable by owner or admin"
ON public.progress FOR SELECT
TO authenticated
USING (
  user_hex_id = (SELECT hex_id FROM public.users WHERE auth_id = auth.uid())
  OR public.get_user_role(auth.uid()) = 'admin'
);

CREATE POLICY "Admin can manage progress"
ON public.progress FOR ALL
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- 8. Fix user_roles policies
DROP POLICY IF EXISTS "Roles insertable" ON public.user_roles;
DROP POLICY IF EXISTS "Roles readable" ON public.user_roles;

CREATE POLICY "Roles readable by admin"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin' OR user_id = public.get_user_id_from_auth(auth.uid()));

CREATE POLICY "Service role can insert roles"
ON public.user_roles FOR INSERT
TO service_role
WITH CHECK (true);
