# Belt Update Verification Guide

## ✅ What Was Fixed

The `UPDATE requires a WHERE clause` error that occurred when:
- Reordering belts with up/down arrows
- Deleting belts (users reassign to previous belt)
- Changing belt levels for users

## 🔍 How to Verify the Fix

### Step 1: Apply the Fix to Supabase

1. Go to: https://supabase.com → Projects → `karatedojuryu-` → SQL Editor
2. Copy the SQL from `/fix_belt_update.sql`
3. Paste it into the SQL Editor and **click "Run"**

Expected output: No errors, functions recreated successfully.

### Step 2: Verify Functions Have WHERE Clauses

Run this test query in the **SQL Editor** to confirm the functions exist:

```sql
-- Check reorder_belts function
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'reorder_belts' AND pronamespace = 'public'::regnamespace;

-- Check delete_belt_safe function
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'delete_belt_safe' AND pronamespace = 'public'::regnamespace;
```

**Look for:** Both functions should include `WHERE` clauses in their UPDATE statements. ✅

### Step 3: Test Belt Reordering in the Admin Panel

1. Go to Admin Dashboard → Belt Changes section
2. Click the **up/down arrow buttons** next to any belt
3. Expected: Belt order changes without errors ✅

### Step 4: Test Changing User Belt Level

1. Go to Admin Dashboard → Users table
2. Click the **Edit** button on any user
3. Change their belt level from the dropdown
4. Click **Save**
5. Expected: Belt updates without "UPDATE requires WHERE clause" error ✅

## 📊 Function Details

### `reorder_belts(_ids uuid[])`

**What it does:** Reorders belt rankings when admin moves belts up/down

**Fixed WHERE clauses:**
```sql
UPDATE public.belts SET order_index = order_index + 10000 WHERE id = ANY(_ids);
UPDATE public.belts SET order_index = i WHERE id = _ids[i];
```

### `delete_belt_safe(_belt_id uuid)`

**What it does:** Safely deletes a belt and reassigns all users to previous belt

**Fixed WHERE clauses:**
```sql
UPDATE public.user_progress 
  SET current_belt_id = prev_belt_id, current_xp_in_belt = 0
  WHERE current_belt_id = _belt_id;

UPDATE public.belts b SET order_index = o.rn FROM ordered o WHERE b.id = o.id;
```

## ✔️ Verification Checklist

- [ ] Applied SQL from `/fix_belt_update.sql` to Supabase
- [ ] Verified functions exist with `pg_get_functiondef`
- [ ] Tested reordering belts (up/down arrows)
- [ ] Tested changing user belt level
- [ ] No "UPDATE requires WHERE clause" errors appear

## 🆘 If Issues Persist

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Reload the page** 
3. **Check Supabase logs**: Project → Logs
4. **Verify you're logged in as admin**

## 📝 Related Files

- Fix SQL: `/fix_belt_update.sql`
- Frontend code: `src/components/admin/BeltManager.tsx` (line 100)
- Frontend code: `src/pages/AdminDashboard.tsx` (line 103+)
- Migration: `supabase/migrations/20260424_fix_reorder_belts.sql`
