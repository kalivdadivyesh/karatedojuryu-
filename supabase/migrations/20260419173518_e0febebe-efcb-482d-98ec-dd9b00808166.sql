-- ============================================
-- CLEAN UP OLD SCHEMA
-- ============================================
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.attendance_records CASCADE;
DROP TABLE IF EXISTS public.progress CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP FUNCTION IF EXISTS public.get_user_id_from_auth(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;

-- ============================================
-- ROLES ENUM + TABLE
-- ============================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS PROFILE TABLE
-- ============================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  hex_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL CHECK (phone ~ '^[0-9]{10}$'),
  belt_level TEXT NOT NULL DEFAULT 'white',
  is_restricted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ATTENDANCE RECORDS
-- ============================================
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- ============================================
-- UPCOMING CLASSES (shared)
-- ============================================
CREATE TABLE public.upcoming_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_date DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.upcoming_classes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.get_email_by_username(_username TEXT)
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT email FROM public.users WHERE username = _username LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_user_restricted(_username TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_restricted FROM public.users WHERE username = _username LIMIT 1), false);
$$;

CREATE OR REPLACE FUNCTION public.generate_unique_hex_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) FROM 1 FOR 6));
    SELECT EXISTS(SELECT 1 FROM public.users WHERE hex_code = new_code) INTO exists_check;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN new_code;
END;
$$;

-- ============================================
-- AUTO-CREATE PROFILE + ROLE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, hex_code, name, username, email, phone, belt_level)
  VALUES (
    NEW.id,
    public.generate_unique_hex_code(),
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', '0000000000'),
    'white'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS POLICIES — user_roles
-- ============================================
CREATE POLICY "Users can read own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES — users
-- ============================================
CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES — attendance_records
-- ============================================
CREATE POLICY "Read own attendance or admin" ON public.attendance_records
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage attendance" ON public.attendance_records
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- RLS POLICIES — upcoming_classes
-- ============================================
CREATE POLICY "Anyone authenticated can view classes" ON public.upcoming_classes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage classes" ON public.upcoming_classes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================
-- REALTIME
-- ============================================
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.attendance_records REPLICA IDENTITY FULL;
ALTER TABLE public.upcoming_classes REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.upcoming_classes;