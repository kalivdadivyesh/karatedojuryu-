-- SQL Verification Tests for Belt Functions
-- Run these in Supabase SQL Editor to verify the fix works

-- ============ TEST 1: Check Functions Exist ============
SELECT 
  proname,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE (proname = 'reorder_belts' OR proname = 'delete_belt_safe')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============ TEST 2: Verify reorder_belts has WHERE clauses ============
-- This should show the function contains both WHERE clauses
SELECT 
  'reorder_belts' as function_name,
  pg_get_functiondef(oid) as definition,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%WHERE id = ANY(_ids)%' THEN '✓ WHERE clause found'
    ELSE '✗ MISSING WHERE clause (ERROR!)'
  END as check_1,
  CASE 
    WHEN pg_get_functiondef(oid) LIKE '%WHERE id = _ids[i]%' THEN '✓ WHERE clause found'
    ELSE '✗ MISSING WHERE clause (ERROR!)'
  END as check_2
FROM pg_proc 
WHERE proname = 'reorder_belts'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============ TEST 3: Verify delete_belt_safe has WHERE clauses ============
-- Should show three WHERE clauses in the function
SELECT 
  'delete_belt_safe' as function_name,
  pg_get_functiondef(oid) as definition,
  (pg_get_functiondef(oid) LIKE '%WHERE current_belt_id = _belt_id%')::int as has_update_where,
  (pg_get_functiondef(oid) LIKE '%WHERE b.id = o.id%')::int as has_gap_close_where
FROM pg_proc 
WHERE proname = 'delete_belt_safe'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- ============ TEST 4: Test Simulation (safe read-only) ============
-- Check current belt data structure
SELECT 
  COUNT(*) as total_belts,
  MIN(order_index) as min_order,
  MAX(order_index) as max_order
FROM public.belts;

-- Check user progress structure
SELECT 
  COUNT(*) as total_users_with_progress,
  COUNT(DISTINCT current_belt_id) as unique_belts_assigned
FROM public.user_progress;

-- ============ TEST 5: Verify Belt and User Progress Tables Exist ============
SELECT 
  'public.belts' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'belts') 
    THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
UNION ALL
SELECT 
  'public.user_progress' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_progress') 
    THEN '✓ EXISTS' ELSE '✗ MISSING' END as status;

-- ============ TEST 6: Display Belt Order (verify integrity) ============
SELECT 
  order_index,
  name,
  is_active,
  (SELECT COUNT(*) FROM public.user_progress WHERE current_belt_id = public.belts.id) as users_with_this_belt
FROM public.belts
ORDER BY order_index;
