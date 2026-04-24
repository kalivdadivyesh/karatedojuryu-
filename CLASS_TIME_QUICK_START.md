# Quick Start: Class Time Feature

## TL;DR - Do This Now

1. **Go to Supabase SQL Editor**
2. **Copy all from:** `/supabase/migrations/20260424_add_class_time.sql`
3. **Paste & Run**
4. **Expected output:** `ALTER TABLE` (no errors)
5. **Done! ✅**

---

## What You Get

### Admin Dashboard
```
Upcoming Classes
┌──────────────┬──────────┬─────┐
│ Date input   │ Time     │ Add │
│ 2026-04-25   │ 18:00    │  +  │
└──────────────┴──────────┴─────┘

Classes list:
✓ 2026-04-25 at 18:00 [×]
✓ 2026-04-25 at 10:00 [×]
```

### User Dashboard Calendar
```
     April 2026
S M T W T F S
 1 2 3 4 5 6 7
 ...
24 25 26 27 28 29 30
      25  ← Day
     18:00 ← Class time
     10:00 ← Another class same day
```

---

## The 4 Steps

| Step | Action | Expected |
|------|--------|----------|
| 1 | Copy SQL file | Have text copied |
| 2 | Paste in Supabase | Text in editor |
| 3 | Click Run | Output: `ALTER TABLE` |
| 4 | Test in app | Time picker visible ✅ |

---

## That's It!

Once done, the time feature is live and working.

**See the full guide in:** `CLASS_TIME_FEATURE.md`
