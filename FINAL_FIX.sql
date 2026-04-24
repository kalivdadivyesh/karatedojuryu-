-- BULLETPROOF FIX FOR "UPDATE requires a WHERE clause" ERROR
-- Copy ALL of this and paste into Supabase SQL Editor, then click Run

-- Step 1: Drop old functions if they exist
DROP FUNCTION IF EXISTS public.reorder_belts(uuid[]);
DROP FUNCTION IF EXISTS public.delete_belt_safe(uuid);

-- Step 2: Create the REORDER function with ALL WHERE clauses explicit
CREATE OR REPLACE FUNCTION public.reorder_belts(_ids uuid[])
RETURNS void AS $$
DECLARE 
  i int;
  array_len int;
BEGIN
  SELECT array_length(_ids, 1) INTO array_len;
  
  -- Verify admin permission
  IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  -- Safety check
  IF array_len IS NULL OR array_len = 0 THEN
    RETURN;
  END IF;

  -- STEP A: Temporary shift all belts in the list
  UPDATE public.belts SET order_index = order_index + 99999 WHERE id = ANY(_ids);

  -- STEP B: Assign each belt its new position
  FOR i IN 1..array_len LOOP
    UPDATE public.belts SET order_index = i WHERE id = _ids[i];
  END LOOP;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 3: Create DELETE function with ALL WHERE clauses explicit  
CREATE OR REPLACE FUNCTION public.delete_belt_safe(_belt_id uuid)
RETURNS integer AS $$
DECLARE
  v_prev_belt_id uuid;
  v_current_order int;
  v_affected int;
BEGIN
  -- Verify admin permission
  IF NOT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin permission required';
  END IF;

  -- Get the current belt's order
  SELECT order_index INTO v_current_order FROM public.belts WHERE id = _belt_id;
  IF v_current_order IS NULL THEN
    RETURN 0;
  END IF;

  -- Find previous active belt
  SELECT id INTO v_prev_belt_id FROM public.belts
    WHERE is_active = true AND order_index < v_current_order
    ORDER BY order_index DESC LIMIT 1;

  -- If no previous, find first active
  IF v_prev_belt_id IS NULL THEN
    SELECT id INTO v_prev_belt_id FROM public.belts
      WHERE is_active = true AND id <> _belt_id
      ORDER BY order_index ASC LIMIT 1;
  END IF;

  -- STEP A: Update users with old belt to new belt
  UPDATE public.user_progress 
    SET current_belt_id = v_prev_belt_id, current_xp_in_belt = 0
    WHERE current_belt_id = _belt_id;
    
  GET DIAGNOSTICS v_affected = ROW_COUNT;

  -- STEP B: Delete the belt
  DELETE FROM public.belts WHERE id = _belt_id;

  -- STEP C: Reorder remaining belts
  WITH new_order AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY order_index) AS new_index
    FROM public.belts
  )
  UPDATE public.belts SET order_index = new_order.new_index
    FROM new_order WHERE public.belts.id = new_order.id;

  RETURN v_affected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 4: Verify functions were created
SELECT 'reorder_belts created' as status UNION ALL SELECT 'delete_belt_safe created';
