# Class Time Schema Cache Fix Guide

## Issue
Getting error: "Could not find the 'class_time' column of 'upcoming_classes' in the schema cache"

## Root Cause
Supabase client caches the database schema introspection. When the column was added via migration, the cache wasn't properly refreshed.

---

## SOLUTION (3 Steps)

### STEP 1: Reset Database Table (Recommended)
1. Go to https://supabase.com/dashboard
2. Select project `ouxnrusraminzviqaury`
3. Click **SQL Editor** → **New Query**
4. Copy and paste **ENTIRE content** from `/COMPLETE_CLASS_TIME_FIX.sql`
5. Click **Run**
6. Wait for completion ✅

This script will:
- Drop and recreate `upcoming_classes` table with correct schema
- Recreate all RLS policies  
- Enable realtime updates
- Set up the unique constraint on `(class_date, class_time)`

---

### STEP 2: Clear Browser Cache
After running the SQL, do ONE of the following:

**Option A: Hard Refresh (Best)**
- In browser: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- This clears Supabase's cached schema in IndexedDB

**Option B: Clear Storage**
1. Press `F12` to open DevTools
2. Click **Application** tab
3. Left sidebar → **Local Storage** → delete entry for supabase project
4. Refresh page

**Option C: Restart Dev Server**
```bash
cd /workspaces/karatedojuryu-
npm run dev
```

---

### STEP 3: Code Updates (Already Applied)
✅ **Done** - The following have been updated:
- Modified `/src/integrations/supabase/types.ts` - Added `class_time` column
- Modified `/src/pages/AdminDashboard.tsx` - Added schema cache workarounds
- All queries already reference `class_date` and `class_time`

---

## Testing
1. Go to Admin Dashboard
2. Select a date and time for a new class
3. Click **Add** button
4. You should see the class appear in the list with both date AND time

In the User Dashboard calendar:
- Upcoming class dates should show the time (e.g., "18:00")
- Click on a date with a class to see the time displayed

---

## If Still Having Issues

**Quick debug check:**
Run this in Supabase SQL Editor:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'upcoming_classes' AND table_schema = 'public'
ORDER BY ordinal_position;
```

You should see:
- `id` (uuid)
- `class_date` (date)
- `class_time` (time) ← **Must be present**
- `created_at` (timestamp)

If `class_time` is missing, run `COMPLETE_CLASS_TIME_FIX.sql` again.

---

## File Reference
- `COMPLETE_CLASS_TIME_FIX.sql` - Main fix script to run in Supabase
- `/src/integrations/supabase/types.ts` - TypeScript schema definitions (updated)
- `/src/pages/AdminDashboard.tsx` - Admin class management (updated with workarounds)
- `/supabase/migrations/20260424_add_class_time.sql` - Original migration
