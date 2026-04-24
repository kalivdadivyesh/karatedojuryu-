-- COMPLETE FIX FOR UPDATE REQUIRES WHERE CLAUSE ERROR
-- Run this ENTIRE script in your Supabase SQL Editor

-- Step 1: Drop the old broken functions completely
DROP FUNCTION IF EXISTS public.reorder_belts(uuid[]) CASCADE;
DROP FUNCTION IF EXISTS public.delete_belt_safe(uuid) CASCADE;

-- Step 2: Create reorder_belts with explicit WHERE conditions
CREATE FUNCTION public.reorder_belts(_ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE 
  i int;
  array_length_val int;
BEGIN
  -- Check admin permission
  IF NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Not authorized to reorder belts';
  END IF;

  -- Get array length once
  array_length_val := array_length(_ids, 1);
  
  IF array_length_val IS NULL OR array_length_val = 0 THEN
    RETURN;
  END IF;

  -- Temp shift to avoid unique constraints
  UPDATE public.belts 
    SET order_index = order_index + 10000 
    WHERE id = ANY(_ids);

  -- Reorder in correct sequence
  FOR i IN 1..array_length_val LOOP
    UPDATE public.belts 
      SET order_index = i 
      WHERE id = _ids[i];
  END LOOP;
END;
$$;

-- Step 3: Create delete_belt_safe with explicit WHERE conditions
CREATE FUNCTION public.delete_belt_safe(_belt_id uuid)
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
  -- Check admin permission
  IF NOT has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Not authorized to delete belts';
  END IF;

  -- Find the order index of belt to delete
  SELECT order_index 
    INTO this_order 
    FROM public.belts 
    WHERE id = _belt_id;
    
  IF this_order IS NULL THEN 
    RETURN 0; 
  END IF;

  -- Find previous active belt
  SELECT id 
    INTO prev_belt_id 
    FROM public.belts
    WHERE is_active = true 
      AND order_index < this_order
    ORDER BY order_index DESC 
    LIMIT 1;

  -- If no previous belt, find first active
  IF prev_belt_id IS NULL THEN
    SELECT id 
      INTO prev_belt_id 
      FROM public.belts
      WHERE is_active = true 
        AND id <> _belt_id
      ORDER BY order_index 
      LIMIT 1;
  END IF;

  -- Update users to previous belt (explicit WHERE)
  UPDATE public.user_progress
    SET current_belt_id = prev_belt_id, current_xp_in_belt = 0
    WHERE current_belt_id = _belt_id;
    
  GET DIAGNOSTICS affected = ROW_COUNT;

  -- Delete the belt (explicit WHERE)
  DELETE FROM public.belts 
    WHERE id = _belt_id;

  -- Close the gap in order_index (explicit WHERE)
  WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY order_index) AS rn
    FROM public.belts
  )
  UPDATE public.belts b 
    SET order_index = o.rn 
    FROM ordered o 
    WHERE b.id = o.id;

  RETURN affected;
END;
$$;
