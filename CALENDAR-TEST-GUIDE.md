# 📅 Employee Calendar - Quick Test Guide

Your server is running at **http://localhost:3000**

---

## 🚀 5-Minute Feature Tour

### 1️⃣ View the Calendar
```
http://localhost:3000/employee/hours
```

**What You See:**
- Monthly calendar grid (Monday-Sunday)
- Today highlighted with blue border + dot
- Month name in German (e.g., "Oktober 2024")
- Navigation arrows (‹ ›)
- "Heute" button (top right)
- Empty state message: "Noch keine Einträge in diesem Monat"

---

### 2️⃣ Create Your First Work Entry

**Steps:**
1. Click on **today's date** (or any day)
2. Modal opens: "Eintrag erstellen"
3. Status is already "Arbeit" (blue button)
4. Fill in:
   - Von: `08:00`
   - Bis: `17:00`
   - Pause: `45`
   - Tätigkeitsbericht: `"Baustelle Nord – Fundament gegossen"`
5. See the hours preview: **"8,25 h"** ✨
6. Click **"Speichern"**
7. Toast appears: "Gespeichert"
8. Modal closes
9. Day now shows **green border** with "8,25h" at the bottom!

---

### 3️⃣ Create a Vacation Day

**Steps:**
1. Click on a **future date**
2. Click **"Urlaub"** status button
3. Notice: Von/Bis/Pause fields **disappear**!
4. Kommentar field appears
5. Enter: `"Familienurlaub"`
6. Click **"Speichern"**
7. Day shows **blue border** (vacation color)

---

### 4️⃣ Create a Sick Day

**Steps:**
1. Click another date
2. Click **"Krank"** status button
3. Kommentar: `"Erkältung"`
4. Click **"Speichern"**
5. Day shows **red border** (sick color)

---

### 5️⃣ View the Summary

**Look at the summary bar below the calendar:**

After creating the 3 entries above, you should see:
- **Gesamtstunden: 8,25 h** (only work hours count)
- **Tage Urlaub: 1**
- **Tage Krank: 1**

This updates **live** as you add/edit/delete entries!

---

### 6️⃣ Edit an Existing Entry

**Steps:**
1. Click on a day that **already has an entry**
2. Modal opens with existing data filled in
3. Change something (e.g., Bis: `18:00`)
4. Hours recalculate automatically
5. Click **"Speichern"**
6. Entry updates!

---

### 7️⃣ Delete an Entry

**Steps:**
1. Click a day with an entry
2. Scroll down in the modal
3. Click **"Eintrag löschen"** (red text)
4. Red confirmation panel appears:
   - "Eintrag löschen?"
   - "Bist du sicher? Dieser Vorgang kann nicht rückgängig gemacht werden."
5. Click **"Löschen"** (red button)
6. Toast: "Gelöscht"
7. Day returns to empty state!

---

### 8️⃣ Month Navigation

**Try This:**
1. Click **›** (right arrow) → Calendar advances to next month
2. Click **‹** (left arrow) → Goes back
3. Click **"Heute"** button → Jumps back to current month

**Notice:** URL updates as you navigate!
- Current month: `?month=2024-10`
- Next month: `?month=2024-11`

---

### 9️⃣ Deep Link to a Month

**Test Deep Linking:**

Open in a new tab:
```
http://localhost:3000/employee/hours?month=2025-01
```

**Result:** Calendar opens directly to **January 2025**!

---

### 🔟 Deep Link to a Specific Day

**Test Day Highlighting:**

1. First, add an entry to October 25, 2024
2. Then open:
```
http://localhost:3000/employee/hours?month=2024-10#2024-10-25
```

**Result:**
- Calendar shows October 2024
- Day 25 **pulses** with blue ring
- Page scrolls to day 25
- Highlight fades after 2 seconds!

---

## ✅ Complete Testing Checklist

### Calendar Display
- [ ] Calendar shows current month on load
- [ ] Today is highlighted (blue border + dot)
- [ ] Weekday headers show Mo-So
- [ ] Calendar starts on Monday (German style)
- [ ] Days are clickable with hover effect

### Month Navigation
- [ ] Next month (›) works
- [ ] Previous month (‹) works
- [ ] "Heute" button returns to current month
- [ ] URL updates with ?month=YYYY-MM

### Work Entry
- [ ] Click day opens modal
- [ ] Status defaults to "Arbeit"
- [ ] Von/Bis/Pause fields visible
- [ ] Tätigkeitsbericht field visible
- [ ] Hours calculate correctly
- [ ] Shows "8,25 h" (German comma format)
- [ ] Export hint shown
- [ ] Save works
- [ ] Toast "Gespeichert" appears
- [ ] Day shows green border + hours

### Vacation Entry
- [ ] Click "Urlaub" status
- [ ] Von/Bis/Pause fields hide
- [ ] Kommentar field appears
- [ ] Save works
- [ ] Day shows blue border

### Sick Entry
- [ ] Click "Krank" status
- [ ] Kommentar field required
- [ ] Save works
- [ ] Day shows red border

### Validation
- [ ] Empty Tätigkeitsbericht → Error message
- [ ] Empty Kommentar → Error message
- [ ] Bis < Von → Error: "Ende muss nach Beginn liegen"
- [ ] Negative pause → Error shown
- [ ] Cannot save with errors

### Edit Entry
- [ ] Click day with entry → Modal opens
- [ ] Existing data pre-filled
- [ ] Can change values
- [ ] Save updates entry

### Delete Entry
- [ ] Delete button appears for existing entries
- [ ] Click shows red confirmation
- [ ] "Abbrechen" cancels deletion
- [ ] "Löschen" removes entry
- [ ] Toast "Gelöscht" appears
- [ ] Day returns to empty

### Monthly Summary
- [ ] Shows "Gesamtstunden"
- [ ] Shows "Tage Urlaub"
- [ ] Shows "Tage Krank"
- [ ] Updates when entry added
- [ ] Updates when entry deleted
- [ ] Only counts current month

### Deep Linking
- [ ] ?month=2024-10 loads October
- [ ] ?month=2025-01 loads January
- [ ] #2024-10-25 highlights day 25
- [ ] Hash scrolls to day
- [ ] Pulse effect appears
- [ ] Pulse fades after 2s

### Mobile (DevTools)
- [ ] Calendar responsive on mobile
- [ ] Day cells large enough to tap
- [ ] Modal scrolls on small screens
- [ ] Form fields mobile-optimized
- [ ] Toast visible on mobile

### Keyboard
- [ ] Tab navigates through days
- [ ] Enter opens day modal
- [ ] Tab through form fields
- [ ] ESC closes modal (if implemented)

---

## 🎯 Quick Test Scenarios

### Scenario A: Log a Full Work Week
1. Add work entries Monday-Friday
2. Each: 08:00-17:00, 45 min pause
3. Summary shows: ~41,25 h total
4. All 5 days have green borders

### Scenario B: Mixed Month
1. Add 10 work days (8h each)
2. Add 2 vacation days
3. Add 1 sick day
4. Summary shows:
   - Gesamtstunden: 80,00 h
   - Tage Urlaub: 2
   - Tage Krank: 1

### Scenario C: Validation Check
1. Open entry modal
2. Von: 17:00
3. Bis: 08:00
4. Try to save → Error!
5. Fix: Bis: 18:00
6. Clear Tätigkeitsbericht
7. Try to save → Error!
8. Fill it in → Saves successfully

### Scenario D: Edit & Delete
1. Create an entry
2. Click the same day again
3. Change hours: 09:00-18:00
4. Save → Entry updates
5. Open again
6. Click "Eintrag löschen"
7. Confirm → Entry gone

---

## 🎨 Visual Guide

### Calendar Day States

**Empty Day:**
```
┌─────┐
│  15 │  ← White background, gray border
└─────┘
```

**Today (Empty):**
```
┌─────┐
│  14 │● ← Blue border, blue dot top-right
└─────┘
```

**Work Day:**
```
┌─────┐
│  13 │  ← Green border
│8,25h│  ← Hours shown at bottom
└─────┘
```

**Vacation Day:**
```
┌─────┐
│  12 │  ← Blue border, blue background
└─────┘
```

**Sick Day:**
```
┌─────┐
│  11 │  ← Red border, red background
└─────┘
```

---

## 🎓 For Beginners: How It Works

### Client-Side State
All your entries are stored in the browser's memory. If you refresh the page, they disappear! This is normal for now. Later, we'll save to a database (Supabase).

### Hours Calculation
The app calculates: `(End time - Start time) - Break = Work hours`

Example:
- Von: 08:00 → Bis: 17:00 = 9 hours
- Minus pause: 45 minutes = 0.75 hours
- Result: 9 - 0.75 = **8.25 hours**
- Display: "8,25 h" (German uses comma, not dot)

### Status Types
- **Arbeit** (Work): You worked this day
- **Urlaub** (Vacation): You were on vacation
- **Krank** (Sick): You were sick

Only work days count toward total hours. Vacation and sick days are just counted as days.

### Deep Links
The URL can control what you see:
- `?month=2024-11` → Shows November 2024
- `#2024-11-15` → Highlights November 15th

This makes it easy to share links!

---

## 🐛 Troubleshooting

### Q: I added an entry but don't see it!
**A:** Make sure you're viewing the correct month. Check the month name at the top.

### Q: The hours don't look right!
**A:** Check your times:
- Bis (End) must be after Von (Start)
- Pause is in minutes, not hours
- Hours show exact decimal (e.g., 8.25 not 8.00)

### Q: I can't save!
**A:** Check for red error messages:
- Tätigkeitsbericht required for work days
- Kommentar required for vacation/sick days
- End time must be after start time

### Q: My entries disappeared!
**A:** Did you refresh the page? Entries are not saved to a database yet. They're only in memory.

### Q: How do I add multiple shifts in one day?
**A:** Currently not supported. One entry per day only (MVP version).

---

## 🎉 Success Indicators

**You've successfully tested everything if:**

✅ You can create work/vacation/sick entries
✅ Calendar shows correct colors for each type
✅ Hours calculate correctly
✅ Summary bar updates live
✅ You can edit entries
✅ You can delete entries
✅ Month navigation works
✅ Deep links work
✅ Mobile view looks good

---

## 📖 Next Steps

After testing, you're ready for:
1. **Supabase Integration** - Save entries to database
2. **Authentication** - User login
3. **Multi-shift Support** - Multiple entries per day
4. **Export Feature** - Download as PDF/Excel

**For now, enjoy your fully functional time-tracking calendar!** 🎊

