-- Fix reorder_belts function with proper WHERE clause
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
