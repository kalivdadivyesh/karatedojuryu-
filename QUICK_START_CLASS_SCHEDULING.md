# Quick Start Guide - Class Scheduling System

## ⚡ 30-Second Overview

The system is **fully built and ready to use**. No config needed.

### What was added:
- Date + Time pickers for classes
- Full admin control panel (Create, Edit, Delete, Bulk Delete)
- Real-time calendar updates
- Proper time formatting (6:00 PM, not 18:00)

---

## 🎯 For Admins

### Create a Class
```
Admin Dashboard → Create Class section
┌────────────────────────────────────┐
│ [Date Picker] [Time Picker] [+ Add]│
└────────────────────────────────────┘
```

**Steps:**
1. Pick a date (today or future)
2. Pick a time (24-hour format)
3. Click "+ Add"
4. Done ✓

### Manage Classes
```
Classes Management Table
┌─────────────────────────────────────┐
│ [Filter by Date]  [Clear Filters]   │
├─────────────────────────────────────┤
│ ☐ | Apr 12, 2026 | 6:00 PM | [Edit][Delete] │
│ ☐ | Apr 12, 2026 | 7:30 PM | [Edit][Delete] │
│ ☐ | Apr 15, 2026 | 5:00 PM | [Edit][Delete] │
└─────────────────────────────────────┘
```

**Features:**
- ✅ Filter by date
- ✅ Edit any class (click Edit button)
- ✅ Delete single class
- ✅ Select multiple → Delete Selected
- ✅ Auto-sorted by nearest first

---

## 👥 For Users

### View Classes
```
User Dashboard → Attendance & Schedule → Calendar
```

**What you see:**
- Days with classes: Grey background
- Times shown: 6:00 PM, 7:30 PM (not 18:00, 19:30)
- Multiple classes per day: Stacked display

---

## 🔧 Technical Details

### Files Added
```
src/
├── hooks/
│   └── useClasses.ts                 ← Custom hook
├── components/admin/
│   ├── CreateClass.tsx               ← Input form
│   ├── ClassesTable.tsx              ← Management table
│   └── EditModal.tsx                 ← Edit dialog
└── migrations/
    └── 20260430_class_scheduling.sql  ← DB schema

Updated:
├── pages/AdminDashboard.tsx
├── pages/UserDashboard.tsx
├── components/AttendanceCalendar.tsx
└── integrations/supabase/client-workaround.ts
```

### Database
```
Table: upcoming_classes
├── id (UUID)
├── class_date (DATE)
├── class_time (TIME)
├── datetime (TIMESTAMP, auto-computed)
└── created_at (TIMESTAMP)
```

### API Methods
```
useClasses() returns:
├── addClass(date, time)
├── updateClass(id, date, time)
├── deleteClass(id)
├── deleteMultiple(ids)
├── classes (array)
└── loading (boolean)
```

---

## ✅ Validation

### What's blocked:
- ❌ Empty date
- ❌ Empty time
- ❌ Past dates
- ❌ Past times (if today)
- ❌ Duplicate class at same time

### What's allowed:
- ✅ Multiple classes per day
- ✅ Same time on different days
- ✅ Editing future classes
- ✅ Bulk operations

---

## 🚀 Deployment Checklist

1. **Run migration** in Supabase:
   - Go to SQL Editor
   - Run: `supabase/migrations/20260430_class_scheduling.sql`
   - Verify table created

2. **Test Admin Features:**
   - Create a class
   - Verify it appears in table
   - Edit it
   - Delete it
   - Bulk delete multiple

3. **Test User Calendar:**
   - Go to User Dashboard
   - Check calendar shows classes with times
   - Verify times are in 12-hour format

4. **Test Real-time:**
   - Open admin & user dashboards side-by-side
   - Add class in admin
   - Verify instant update in user calendar

---

## 🐛 Troubleshooting

### Classes not showing?
- [ ] Run migration
- [ ] Check Supabase table exists
- [ ] Hard refresh (Cmd+Shift+R)
- [ ] Check browser console for errors

### Times showing as 24-hour?
- [ ] AttendanceCalendar.tsx has `formatTime()` function
- [ ] Verify it's being called
- [ ] Check time format is HH:MM

### Can't edit/delete?
- [ ] Verify you're logged in as admin
- [ ] Check RLS policies in Supabase
- [ ] Verify user has admin role

---

## 📊 Example Data

```javascript
// What gets stored
{
  id: "550e8400-e29b-41d4-a716-446655440000",
  class_date: "2026-04-15",
  class_time: "18:00",
  datetime: "2026-04-15T18:00:00",
  created_at: "2026-04-01T12:30:00"
}

// How it displays
Date: Apr 15, 2026
Time: 6:00 PM
```

---

## 🎨 Component Props

### CreateClass
```tsx
<CreateClass 
  onAdd={async (date, time) => ({ success: boolean })}
  isLoading={false}
/>
```

### ClassesTable
```tsx
<ClassesTable
  classes={UpcomingClass[]}
  onEdit={(classData) => void}
  onDelete={async (id) => ({ success: boolean })}
  onDeleteMultiple={async (ids) => ({ success: boolean })}
/>
```

### EditModal
```tsx
<EditModal
  isOpen={boolean}
  classData={UpcomingClass | null}
  onSave={async (id, date, time) => ({ success: boolean })}
  onCancel={() => void}
/>
```

---

## 📞 Support

All errors logged to browser console. Check for:
- Network errors (404, 500)
- Validation errors (date/time invalid)
- Permission errors (not admin)
- Type errors (wrong data format)

