# Class Date & Time Feature Setup

## Summary of Changes

✅ **Admin Dashboard:**
- Date input + **NEW Time input** for selecting class time
- Displays: "2026-04-24 at 18:00"
- Can add multiple classes on the same day at different times

✅ **User Dashboard:**
- Shows class time below day number in calendar
- Displays: Day | 18:00 on the calendar

✅ **Database:**
- New `class_time` column on `upcoming_classes` table
- Can now have multiple classes per date

---

## Step 1: Apply Database Migration

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Copy ENTIRE content from `/supabase/migrations/20260424_add_class_time.sql`
3. Paste into SQL Editor
4. Click **"Run"**

**Expected Output:**
```
ALTER TABLE
```

This means the column was added successfully ✅

---

## Step 2: Verify in Supabase

Run this query in SQL Editor to confirm:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'upcoming_classes';
```

You should see:
- `class_date` (date)
- `class_time` (time)
- `created_at` (timestamp with time zone)

---

## Step 3: Test in Your App

### Admin Dashboard

1. Go to **Admin Dashboard** → "Upcoming Classes" section
2. You should now see TWO input fields:
   - 📅 Date picker (existing)
   - 🕐 **NEW Time picker** (default: 18:00)

3. **Test adding a class:**
   - Select date: `2026-04-25`
   - Select time: `19:00`
   - Click **"Add"**
   - Should display: `2026-04-25 at 19:00` ✅

4. **Test adding same date, different time:**
   - Select date: `2026-04-25` (same day)
   - Select time: `10:00` (different time)
   - Click **"Add"**
   - Should display both times ✅

### User Dashboard

1. Go to **User Dashboard** → "Attendance & Schedule" section
2. Look at the calendar
3. Days with upcoming classes should show:
   ```
   25
   19:00
   10:00
   ```
   (Shows the day number and all class times for that day) ✅

4. **Test real-time update:**
   - Have admin add a new class time
   - User's calendar should update automatically ✅

---

## Code Changes Made

### 1. Admin Dashboard (`src/pages/AdminDashboard.tsx`)

**Added time state:**
```typescript
const [newClassTime, setNewClassTime] = useState("18:00");
```

**Updated queries to include class_time:**
```typescript
// Before: select("class_date")
// After:
select("class_date, class_time").order("class_date").order("class_time")
```

**Updated addClass function:**
```typescript
// Before: insert({ class_date: newClassDate })
// After:
insert({ class_date: newClassDate, class_time: newClassTime })
```

**Updated UI to show time input:**
```jsx
<input type="time" value={newClassTime} onChange={(e) => setNewClassTime(e.target.value)} />
```

**Display format changed:**
```jsx
// Before: {d}
// After: {c.class_date} at {c.class_time}
```

### 2. Attendance Calendar (`src/components/AttendanceCalendar.tsx`)

**Updated Props interface:**
```typescript
// Before: upcoming: Set<string>
// After:
upcoming: Array<{ class_date: string; class_time: string }>
```

**Shows time on calendar:**
```jsx
{isUpcoming && (
  <div className="text-xs font-body mt-0.5">
    {upcomingClasses.map(c => (
      <div key={`${c.class_date}-${c.class_time}`}>
        {c.class_time}
      </div>
    ))}
  </div>
)}
```

### 3. User Dashboard (`src/pages/UserDashboard.tsx`)

**Updated state:**
```typescript
// Before: upcoming: Set<string>
// After:
upcoming: Array<{ class_date: string; class_time: string }>
```

**Updated query:**
```typescript
// Before: select("class_date")
// After:
select("class_date, class_time")
```

**Updated assignment:**
```typescript
// Before: setUpcoming(new Set(u.map((c: any) => c.class_date)))
// After:
setUpcoming(u as Array<{ class_date: string; class_time: string }>)
```

---

## Database Migration Details

File: `/supabase/migrations/20260424_add_class_time.sql`

**What it does:**

1. **Adds time column:**
   ```sql
   ALTER TABLE public.upcoming_classes 
   ADD COLUMN class_time TIME NOT NULL DEFAULT '18:00';
   ```

2. **Removes old unique constraint:**
   ```sql
   ALTER TABLE public.upcoming_classes 
   DROP CONSTRAINT upcoming_classes_class_date_key;
   ```
   *(Allows multiple classes on same date)*

3. **Adds new unique constraint:**
   ```sql
   ALTER TABLE public.upcoming_classes 
   ADD CONSTRAINT upcoming_classes_date_time_unique UNIQUE (class_date, class_time);
   ```
   *(Prevents duplicate date+time combinations)*

---

## How It Works

### Flow: Admin Creates Class

```
1. Admin selects date: 2026-04-25
2. Admin selects time: 19:00
3. Admin clicks "Add"
   ↓
4. INSERT into upcoming_classes:
   - class_date: '2026-04-25'
   - class_time: '19:00'
   ↓
5. Real-time update sent to all users
   ↓
6. User Dashboards auto-refresh calendar
   ↓
7. Users see "25" with "19:00" below it
```

### Real-Time Flow

```
Admin adds class
   ↓
Supabase publishes to "upcoming_classes" channel
   ↓
User Dashboard subscribed to "upcoming_classes" changes
   ↓
useEffect hook fires: load()
   ↓
fetchBelts() and other data reload
   ↓
Calendar re-renders with new time
   ↓
Users see time instantly without refreshing!
```

---

## Features

✅ **Multiple classes per day** - Can have 10:00 and 18:00 on same day
✅ **Real-time updates** - Users see new times automatically
✅ **Validation** - Prevents duplicate date+time combinations
✅ **Default time** - 18:00 (6 PM) is default
✅ **User format** - Shows time in 24-hour format

---

## Troubleshooting

### Problem: Time input doesn't appear

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Reload page (F5)
3. Check console for errors (F12)

### Problem: Error when adding class

**Solution:**
1. Make sure both date and time are selected
2. Check there's no duplicate date+time combo
3. Verify you're logged in as admin

### Problem: Calendar doesn't show times

**Solution 1:** Refresh page

**Solution 2:** Check real-time is working:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.upcoming_classes;
```

---

## Files Changed

| File | Changes |
|------|---------|
| `src/pages/AdminDashboard.tsx` | Added time state, updated queries, added time input UI |
| `src/pages/UserDashboard.tsx` | Updated to pass class times to calendar |
| `src/components/AttendanceCalendar.tsx` | Updated to display times on calendar |
| `supabase/migrations/20260424_add_class_time.sql` | Added class_time column to database |

---

## Verification Checklist

- [ ] Applied migration in Supabase SQL Editor
- [ ] Migration ran successfully (no errors)
- [ ] Admin Dashboard shows time input field
- [ ] Can add class with date + time
- [ ] Classes display as "DATE at TIME"
- [ ] User Dashboard calendar shows time below day number
- [ ] Real-time updates work (no refresh needed)

---

## What's Next

The system is now complete! You have:
- ✅ Admin can select date + time for classes
- ✅ Users see times on their calendar
- ✅ Real-time updates to all users
- ✅ Prevents duplicate classes
- ✅ Beautiful calendar display

**All done!** 🎉
