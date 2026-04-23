
-- ============ BELTS TABLE ============
CREATE TABLE public.belts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  order_index integer NOT NULL,
  xp_required integer NOT NULL DEFAULT 1000 CHECK (xp_required >= 0),
  color text NOT NULL DEFAULT '#cccccc',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX belts_order_idx ON public.belts(order_index);

ALTER TABLE public.belts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated reads belts"
  ON public.belts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage belts"
  ON public.belts FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

-- Seed defaults
INSERT INTO public.belts (name, order_index, xp_required, color) VALUES
  ('White',     1,  1000, '#f8fafc'),
  ('White II',  2,  1000, '#e2e8f0'),
  ('Yellow',    3,  1000, '#facc15'),
  ('Orange',    4,  1000, '#fb923c'),
  ('Green',     5,  1000, '#22c55e'),
  ('Purple',    6,  1000, '#a855f7'),
  ('Blue',      7,  1000, '#3b82f6'),
  ('Brown III', 8,  1000, '#a16207'),
  ('Brown II',  9,  1000, '#854d0e'),
  ('Brown I',  10,  1000, '#713f12'),
  ('Black',    11,  1000, '#0a0a0a');

-- ============ USER PROGRESS ============
CREATE TABLE public.user_progress (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_xp integer NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  current_belt_id uuid REFERENCES public.belts(id) ON DELETE SET NULL,
  current_xp_in_belt integer NOT NULL DEFAULT 0 CHECK (current_xp_in_belt >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own progress or admin"
  ON public.user_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admins write progress"
  ON public.user_progress FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'))
  WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_user_progress_updated
  BEFORE UPDATE ON public.user_progress
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill progress for existing users (map text belt_level -> belt id by name approximation)
INSERT INTO public.user_progress (user_id, total_xp, current_belt_id, current_xp_in_belt)
SELECT
  u.id,
  0,
  COALESCE(
    (SELECT b.id FROM public.belts b
       WHERE lower(replace(b.name,' ','')) = lower(
         CASE u.belt_level
           WHEN 'white2' THEN 'whiteii'
           WHEN 'brown3' THEN 'browniii'
           WHEN 'brown2' THEN 'brownii'
           WHEN 'brown1' THEN 'browni'
           ELSE u.belt_level
         END
       )
       LIMIT 1),
    (SELECT id FROM public.belts ORDER BY order_index LIMIT 1)
  ),
  0
FROM public.users u
ON CONFLICT (user_id) DO NOTHING;

-- ============ BELT CHANGE LOG ============
CREATE TABLE public.belt_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('add','edit','delete','reorder')),
  old_value jsonb,
  new_value jsonb,
  affected_users_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.belt_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read log"
  ON public.belt_change_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert log"
  ON public.belt_change_log FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') AND admin_id = auth.uid());

-- ============ HANDLE NEW USER (assign first active belt + progress row) ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  first_belt_id uuid;
  first_belt_name text;
BEGIN
  SELECT id, name INTO first_belt_id, first_belt_name
    FROM public.belts WHERE is_active = true
    ORDER BY order_index LIMIT 1;

  INSERT INTO public.users (id, hex_code, name, username, email, phone, belt_level)
  VALUES (
    NEW.id,
    public.generate_unique_hex_code(),
    COALESCE(NEW.raw_user_meta_data->>'name','User'),
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone','0000000000'),
    COALESCE(first_belt_name,'White')
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  INSERT INTO public.user_progress (user_id, total_xp, current_belt_id, current_xp_in_belt)
    VALUES (NEW.id, 0, first_belt_id, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ DELETE BELT WITH FALLBACK ============
CREATE OR REPLACE FUNCTION public.delete_belt_safe(_belt_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_belt_id uuid;
  this_order int;
  affected int;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT order_index INTO this_order FROM public.belts WHERE id = _belt_id;
  IF this_order IS NULL THEN RETURN 0; END IF;

  SELECT id INTO prev_belt_id FROM public.belts
    WHERE is_active = true AND order_index < this_order
    ORDER BY order_index DESC LIMIT 1;

  IF prev_belt_id IS NULL THEN
    SELECT id INTO prev_belt_id FROM public.belts
      WHERE is_active = true AND id <> _belt_id
      ORDER BY order_index LIMIT 1;
  END IF;

  UPDATE public.user_progress
    SET current_belt_id = prev_belt_id, current_xp_in_belt = 0
    WHERE current_belt_id = _belt_id;
  GET DIAGNOSTICS affected = ROW_COUNT;

  DELETE FROM public.belts WHERE id = _belt_id;

  -- Close the gap in order_index
  WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY order_index) AS rn
    FROM public.belts
  )
  UPDATE public.belts b SET order_index = o.rn FROM ordered o WHERE b.id = o.id;

  RETURN affected;
END;
$$;

-- ============ REORDER BELTS (atomic) ============
CREATE OR REPLACE FUNCTION public.reorder_belts(_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE i int;
BEGIN
  IF NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  -- temp shift to avoid unique conflicts
  UPDATE public.belts SET order_index = order_index + 10000 WHERE true;
  FOR i IN 1..array_length(_ids,1) LOOP
    UPDATE public.belts SET order_index = i WHERE id = _ids[i];
  END LOOP;
END;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.belts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_progress;
