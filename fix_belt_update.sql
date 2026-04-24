-- Fix UPDATE requires a WHERE clause error in reorder_belts function
-- Run this in your Supabase SQL Editor (Copy the entire script and paste it)

DROP FUNCTION IF EXISTS public.reorder_belts(uuid[]);

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
  UPDATE public.belts SET order_index = order_index + 10000 WHERE id = ANY(_ids);
  FOR i IN 1..array_length(_ids,1) LOOP
    UPDATE public.belts SET order_index = i WHERE id = _ids[i];
  END LOOP;
END;
$$;

-- Also ensure delete_belt_safe has proper WHERE clauses
DROP FUNCTION IF EXISTS public.delete_belt_safe(uuid);

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
